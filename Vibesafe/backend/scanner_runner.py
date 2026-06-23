"""
Runs the VibeSafe audit.py scanner as a subprocess and parses its output.

The backend shells out to the CLI scanner rather than importing it directly,
keeping the scanner and server loosely coupled.
"""

import json
import logging
import os
import subprocess
import sys
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

# Path to the scanner script
_SCANNER_DIR = Path(__file__).resolve().parent.parent / "scanner"
_AUDIT_SCRIPT = _SCANNER_DIR / "audit.py"
_SHIELD_SCRIPT = _SCANNER_DIR / "shield.py"


def run_audit(
    repo_url: str | None = None,
    url: str | None = None,
    email: str | None = None,
    timeout: int = 300,
) -> dict:
    """
    Run audit.py as a subprocess and capture results.

    Returns a dict with:
        - status: "completed" | "failed"
        - summary: short description
        - findings: list of finding dicts
        - report_md: full markdown report text
        - badge_html: HTML trust badge
        - error: error message if failed
    """
    if not _AUDIT_SCRIPT.exists():
        return {
            "status": "failed",
            "error": f"Scanner script not found at {_AUDIT_SCRIPT}",
        }

    # audit.py outputs to CWD — use a temp dir to isolate
    with tempfile.TemporaryDirectory(prefix="vibesafe-scan-") as tmpdir:
        cmd = [sys.executable, str(_AUDIT_SCRIPT)]
        if repo_url:
            cmd.extend(["--repo", repo_url])
        if url:
            cmd.extend(["--url", url])
        if email:
            cmd.extend(["--email", email])

        logger.info("Running: %s", " ".join(cmd))

        try:
            result = subprocess.run(
                cmd,
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            return {
                "status": "failed",
                "error": f"Scan timed out after {timeout}s",
                "summary": "",
                "findings": [],
                "report_md": "",
                "badge_html": "",
            }
        except Exception as exc:
            return {
                "status": "failed",
                "error": str(exc),
                "summary": "",
                "findings": [],
                "report_md": "",
                "badge_html": "",
            }

        # Read generated files from temp dir
        report_md = ""
        badge_html = ""
        report_path = Path(tmpdir) / "vibesafe-report.md"
        badge_path = Path(tmpdir) / "vibesafe-badge.html"

        if report_path.exists():
            report_md = report_path.read_text(encoding="utf-8")

        if badge_path.exists():
            badge_html = badge_path.read_text(encoding="utf-8")

        # Parse findings from the report (simple extraction)
        findings = _parse_findings_from_report(report_md)

        stdout = result.stdout or ""
        stderr = result.stderr or ""

        if result.returncode != 0:
            logger.warning(
                "Scanner exited with code %d:\n%s\n%s",
                result.returncode,
                stdout[-2000:],
                stderr[-2000:],
            )
            # Still return what we have — partial results are useful
            return {
                "status": "completed",
                "summary": f"Scanner exited with code {result.returncode}. See report for details.",
                "findings": findings,
                "report_md": report_md,
                "badge_html": badge_html,
                "error": stderr[-2000:] if stderr else None,
            }

        # Count issues
        issues = [f for f in findings if f.get("severity", "").lower() != "info"]
        summary = f"Found {len(issues)} issue(s) across {len(findings)} total finding(s)."

        return {
            "status": "completed",
            "summary": summary,
            "findings": findings,
            "report_md": report_md,
            "badge_html": badge_html,
            "error": None,
        }


def run_shield(stack: str, output: str = "CLAUDE.md") -> dict:
    """
    Run shield.py as a subprocess to generate a security context file.

    Returns dict with:
        - status: "completed" | "failed"
        - content: the generated shield file content
        - error: error message if failed
    """
    if not _SHIELD_SCRIPT.exists():
        return {
            "status": "failed",
            "error": f"Shield script not found at {_SHIELD_SCRIPT}",
        }

    with tempfile.TemporaryDirectory(prefix="vibesafe-shield-") as tmpdir:
        out_path = Path(tmpdir) / output
        cmd = [
            sys.executable, str(_SHIELD_SCRIPT),
            "--stack", stack,
            "--output", str(out_path),
        ]

        logger.info("Running: %s", " ".join(cmd))

        try:
            result = subprocess.run(
                cmd,
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=30,
            )
        except subprocess.TimeoutExpired:
            return {"status": "failed", "error": "Shield generation timed out"}
        except Exception as exc:
            return {"status": "failed", "error": str(exc)}

        if result.returncode != 0:
            return {
                "status": "failed",
                "error": result.stderr[-2000:] or "Shield generation failed",
            }

        content = ""
        if out_path.exists():
            content = out_path.read_text(encoding="utf-8")

        return {"status": "completed", "content": content}


def _parse_findings_from_report(report_md: str) -> list[dict]:
    """
    Parse findings from the vibesafe-report.md markdown.

    The report format uses emoji severity labels like:
      🔴 CRITICAL  |  🟠 HIGH  |  🟡 MEDIUM  |  🟢 LOW  |  🔵 INFO

    We look for severity lines followed by finding descriptions.
    """
    findings = []
    if not report_md:
        return findings

    severity_map = {
        "🔴": "critical",
        "🟠": "high",
        "🟡": "medium",
        "🟢": "low",
        "🔵": "info",
        "CRITICAL": "critical",
        "HIGH": "high",
        "MEDIUM": "medium",
        "LOW": "low",
        "INFO": "info",
    }

    import re

    # Parse findings by looking for severity markers in the report
    lines = report_md.split("\n")
    current_severity = None
    current_title = None
    current_description = ""

    for line in lines:
        stripped = line.strip()

        # Check for severity markers at start of line
        for marker, sev in severity_map.items():
            if stripped.startswith(marker):
                current_severity = sev
                # Title is the rest after the marker
                title = stripped[len(marker):].strip().lstrip("|").strip()
                if title and not title.startswith("-"):
                    current_title = title
                break
        else:
            # Check if line starts with severity word (e.g., "CRITICAL | ...")
            for word, sev in sorted(severity_map.items(), key=lambda x: -len(x[0])):
                if stripped.upper().startswith(word) and len(word) > 2:
                    current_severity = sev
                    title = stripped[len(word):].strip().lstrip("|").strip()
                    if title:
                        current_title = title
                    break

        # Collect finding items (bullet points)
        if stripped.startswith("-") and current_severity and current_title:
            desc = stripped.lstrip("- ").strip()
            findings.append({
                "severity": current_severity,
                "title": current_title,
                "description": desc,
                "check": desc.split(":")[0] if ":" in desc else "",
            })
            current_description = ""
        elif stripped.startswith("-") and current_severity and not current_title:
            # Fallback: standalone bullet
            findings.append({
                "severity": current_severity,
                "title": "Finding",
                "description": stripped.lstrip("- ").strip(),
                "check": "",
            })

    # Deduplicate
    seen = set()
    unique = []
    for f in findings:
        key = (f["severity"], f["description"])
        if key not in seen:
            seen.add(key)
            unique.append(f)

    return unique
