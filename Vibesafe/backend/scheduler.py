"""
Weekly auto-scan scheduler for monitored repos.

Uses APScheduler to run weekly scans. When a scan finds new issues,
it queues an email notification to the registered user.

Run alongside the FastAPI app:
    from scheduler import start_scheduler
    start_scheduler()
"""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from database import (
    list_monitors,
    get_scan,
    register_monitor as db_register_monitor,
    update_scan_result,
    insert_scan,
    update_monitor_last_scan,
)
from email_service import send_scan_notification, send_welcome_email
from scanner_runner import run_audit

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> BackgroundScheduler:
    """Start the background scheduler for weekly auto-scans."""
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    _scheduler = BackgroundScheduler(daemon=True)
    # Run weekly auto-scans every Sunday at 6:00 AM
    _scheduler.add_job(
        func=run_weekly_scans,
        trigger="cron",
        day_of_week="sun",
        hour=6,
        minute=0,
        id="weekly_scan",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    _scheduler.start()
    logger.info("Scheduler started — weekly scans every Sunday 06:00")
    return _scheduler


def stop_scheduler() -> None:
    """Shut down the scheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler stopped")


def run_weekly_scans() -> int:
    """
    Run scans for all active monitored repos. Returns number of scans run.

    Called by the scheduler. Also called on first monitor registration
    to do an immediate initial scan.
    """
    monitors = list_monitors(is_active=True)
    if not monitors:
        logger.info("No active monitors to scan.")
        return 0

    count = 0
    for mon in monitors:
        try:
            _scan_monitor(mon)
            count += 1
        except Exception as e:
            logger.exception("Failed to scan monitor %s: %s", mon.get("id"), e)

    logger.info("Weekly scan complete: %d repos scanned", count)
    return count


def _scan_monitor(mon: dict) -> None:
    """Run a scan for a single monitored repo and send notifications."""
    monitor_id = mon["id"]
    repo_url = mon.get("repo_url") or ""
    url = mon.get("url") or ""
    email = mon.get("email") or ""

    logger.info("Scanning monitored repo %s (monitor %d)", repo_url, monitor_id)

    # Insert pending scan
    scan_id = insert_scan(repo_url=repo_url or None, url=url or None, email=email or None)

    # Run the scan
    result = run_audit(repo_url=repo_url or None, url=url or None)

    # Update scan record
    findings = result.get("findings", [])
    issues = [f for f in findings if f.get("severity", "").lower() != "info"]

    update_scan_result(
        scan_id=scan_id,
        status=result.get("status", "failed"),
        summary=result.get("summary", ""),
        findings=findings,
        report_md=result.get("report_md", ""),
        badge_html=result.get("badge_html", ""),
    )

    # Link to monitor
    update_monitor_last_scan(monitor_id, scan_id)

    # Send notification if issues found and email is configured
    if issues and email:
        send_scan_notification(
            to_email=email,
            repo_url=repo_url,
            scan_id=scan_id,
            findings_count=len(issues),
        )
        logger.info(
            "Notification queued for %s — %d issue(s) found",
            email, len(issues),
        )


def run_initial_scan(repo_url: str, url: str | None, email: str, monitor_id: int) -> dict:
    """
    Run an initial scan immediately when a repo is registered.

    Returns the scan result.
    """
    scan_id = insert_scan(repo_url=repo_url or None, url=url or None, email=email)
    result = run_audit(repo_url=repo_url or None, url=url or None)

    findings = result.get("findings", [])
    issues = [f for f in findings if f.get("severity", "").lower() != "info"]

    update_scan_result(
        scan_id=scan_id,
        status=result.get("status", "failed"),
        summary=result.get("summary", ""),
        findings=findings,
        report_md=result.get("report_md", ""),
        badge_html=result.get("badge_html", ""),
    )

    update_monitor_last_scan(monitor_id, scan_id)

    # Send welcome email
    if email:
        send_welcome_email(to_email=email, repo_url=repo_url, monitor_id=monitor_id)

    return {
        "scan_id": scan_id,
        "status": result.get("status"),
        "summary": result.get("summary", ""),
        "findings_count": len(issues),
        "total_findings": len(findings),
    }
