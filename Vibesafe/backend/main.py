"""
VibeSafe Backend API — FastAPI server.

Endpoints:
  POST   /api/scan              Run a security scan
  GET    /api/scan/{id}         Get scan results
  POST   /api/shield            Generate a shield file
  POST   /api/monitor           Register a repo for weekly auto-scans
  GET    /api/monitor           List all monitored repos
  GET    /api/monitor/{id}      Get monitor details & last scan
  DELETE /api/monitor/{id}      Deactivate a monitor
  POST   /api/email/process     Flush pending email queue
  GET    /api/health            Health check
  GET    /api/stats             Dashboard stats
  GET    /dashboard             Dashboard UI page
"""

import logging
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

# Add parent dir so scanner/ imports work from this context
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import init_db, insert_scan, update_scan_result, get_scan, list_scans
from database import register_monitor, get_monitor, list_monitors, deactivate_monitor
from models import ScanRequest, ShieldRequest, MonitorRequest
from scanner_runner import run_audit, run_shield
from email_service import process_pending_emails
from scheduler import start_scheduler, run_initial_scan

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, start scheduler. Shutdown: stop scheduler."""
    init_db()
    try:
        start_scheduler()
    except Exception as e:
        logger.warning("Scheduler not started: %s", e)
    yield
    from scheduler import stop_scheduler
    stop_scheduler()


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VibeSafe Backend API",
    description="Security scanning, shield generation, and repo monitoring",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the landing page and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",
        "https://vibesafe.store",
        "https://*.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving for the dashboard & site
# ---------------------------------------------------------------------------

from fastapi.staticfiles import StaticFiles

# Serve the site/ directory at /site (for assets)
site_path = Path(__file__).resolve().parent.parent / "site"
if site_path.exists():
    app.mount("/site", StaticFiles(directory=str(site_path), html=True), name="site")

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "vibesafe-backend",
        "version": "1.0.0",
    }


@app.post("/api/scan")
async def run_scan(request: ScanRequest) -> dict:
    """
    Run a security scan.

    Accepts repo_url (path to local source code), url (live URL),
    and/or email (for breach check). Runs audit.py via subprocess
    and stores results in SQLite.
    """
    if not request.repo_url and not request.url:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of: repo_url (source path), url (live URL)",
        )

    # Create scan record
    scan_id = insert_scan(
        repo_url=request.repo_url,
        url=request.url,
        email=request.email,
    )

    logger.info("Scan %d started: repo=%s, url=%s", scan_id, request.repo_url, request.url)

    try:
        result = run_audit(
            repo_url=request.repo_url,
            url=request.url,
            email=request.email,
        )

        update_scan_result(
            scan_id=scan_id,
            status=result.get("status", "failed"),
            summary=result.get("summary", ""),
            findings=result.get("findings", []),
            report_md=result.get("report_md", ""),
            badge_html=result.get("badge_html", ""),
        )

        return {
            "id": scan_id,
            "status": result.get("status"),
            "summary": result.get("summary", ""),
            "findings": result.get("findings", []),
            "error": result.get("error"),
        }

    except Exception as exc:
        logger.exception("Scan %d failed unexpectedly", scan_id)
        update_scan_result(scan_id=scan_id, status="failed", summary=str(exc))
        raise HTTPException(status_code=500, detail=f"Scan failed: {exc}")


@app.get("/api/scan/{scan_id}")
async def get_scan_result(scan_id: int) -> dict:
    """Get the results of a completed scan."""
    scan = get_scan(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan #{scan_id} not found")

    # Expose key fields
    return {
        "id": scan["id"],
        "repo_url": scan.get("repo_url"),
        "url": scan.get("url"),
        "status": scan["status"],
        "summary": scan.get("summary", ""),
        "findings": scan.get("findings", []),
        "report_md": scan.get("report_md", ""),
        "badge_html": scan.get("badge_html", ""),
        "created_at": scan["created_at"],
        "completed_at": scan.get("completed_at"),
    }


@app.get("/api/scans")
async def list_recent_scans(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    """List recent scans."""
    return list_scans(limit=limit, offset=offset)


@app.post("/api/shield")
async def generate_shield(request: ShieldRequest) -> dict:
    """Generate a security context shield file for a given stack."""
    result = run_shield(stack=request.stack, output=request.output)
    if result.get("status") == "failed":
        raise HTTPException(status_code=400, detail=result.get("error", "Shield generation failed"))
    return result


@app.post("/api/monitor")
async def create_monitor(request: MonitorRequest) -> dict:
    """
    Register a repo for weekly auto-scans.

    Runs an initial scan immediately and queues a welcome email.
    The repo will then be scanned every Sunday at 6 AM.
    """
    if not request.repo_url.strip():
        raise HTTPException(status_code=400, detail="repo_url is required")

    if not request.email.strip() or "@" not in request.email:
        raise HTTPException(status_code=400, detail="A valid email is required")

    monitor_id = register_monitor(
        repo_url=request.repo_url.strip(),
        url=request.url.strip() if request.url else None,
        email=request.email.strip(),
    )

    logger.info("Monitor %d registered: %s → %s", monitor_id, request.repo_url, request.email)

    # Run initial scan
    try:
        initial = run_initial_scan(
            repo_url=request.repo_url.strip(),
            url=request.url.strip() if request.url else None,
            email=request.email.strip(),
            monitor_id=monitor_id,
        )
    except Exception as e:
        logger.error("Initial scan failed for monitor %d: %s", monitor_id, e)
        initial = {"scan_id": None, "status": "failed", "summary": str(e)}

    return {
        "monitor_id": monitor_id,
        "repo_url": request.repo_url,
        "email": request.email,
        "initial_scan": initial,
        "message": "Repo registered for weekly auto-scans. Initial scan complete.",
    }


@app.get("/api/monitor")
async def list_all_monitors() -> list[dict]:
    """List all active monitored repos."""
    return list_monitors(is_active=True)


@app.get("/api/monitor/{monitor_id}")
async def get_monitor_details(monitor_id: int) -> dict:
    """Get a monitor's details and its last scan."""
    mon = get_monitor(monitor_id)
    if mon is None:
        raise HTTPException(status_code=404, detail=f"Monitor #{monitor_id} not found")

    result = dict(mon)

    # Attach last scan if available
    if mon.get("last_scan_id"):
        scan = get_scan(mon["last_scan_id"])
        if scan:
            result["last_scan"] = scan

    return result


@app.delete("/api/monitor/{monitor_id}")
async def remove_monitor(monitor_id: int) -> dict:
    """Deactivate a monitor."""
    ok = deactivate_monitor(monitor_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Monitor #{monitor_id} not found")
    return {"status": "deactivated", "id": monitor_id}


@app.post("/api/email/process")
async def flush_emails() -> dict:
    """Process all pending emails in the queue."""
    sent = process_pending_emails()
    return {"sent": sent}


@app.get("/api/stats")
async def get_stats() -> dict:
    """Dashboard statistics."""
    scans = list_scans(limit=10000)
    monitors = list_monitors(is_active=True)
    total_scans = len(scans)
    completed_scans = len([s for s in scans if s["status"] == "completed"])
    failed_scans = len([s for s in scans if s["status"] == "failed"])
    total_findings = 0
    for s in scans:
        if s.get("findings"):
            total_findings += len(s["findings"]) if isinstance(s["findings"], list) else 0

    return {
        "total_scans": total_scans,
        "completed_scans": completed_scans,
        "failed_scans": failed_scans,
        "active_monitors": len(monitors),
        "total_findings": total_findings,
        "latest_scan": dict(scans[0]) if scans else None,
    }


# ---------------------------------------------------------------------------
# Dashboard UI page
# ---------------------------------------------------------------------------


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page() -> str:
    """Serve the dashboard HTML page."""
    dash_path = Path(__file__).parent / "dashboard.html"
    if not dash_path.exists():
        return HTMLResponse("<h1>Dashboard not found</h1>", status_code=404)
    return dash_path.read_text(encoding="utf-8")
