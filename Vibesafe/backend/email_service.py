"""
VibeSafe Email Notification Service.

Current: logs to a file (mail.log) for development.
Future: plug in SendGrid / Resend / SMTP by replacing send_email().

Usage:
    from email_service import send_email, process_pending_emails
    send_email("user@example.com", "Subject", "Body text")
"""

import logging
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from database import get_pending_emails, mark_email_sent, queue_email

logger = logging.getLogger(__name__)

_LOG_PATH = Path(__file__).parent / "mail.log"


def send_email(to_email: str, subject: str, body_text: str, body_html: str = "") -> bool:
    """
    Send an email. Current implementation writes to a log file.

    To switch to a real provider (SendGrid / Resend / SMTP), replace the
    body of this function. The signature stays the same.

    Args:
        to_email: Recipient email address.
        subject:  Email subject line.
        body_text: Plain-text body.
        body_html: Optional HTML body.

    Returns:
        True if the email was accepted, False otherwise.
    """
    # ── Log to file (development) ──────────────────────────────────────────
    timestamp = datetime.now(timezone.utc).isoformat()
    log_entry = (
        f"=== EMAIL [{timestamp}] ===\n"
        f"To:      {to_email}\n"
        f"Subject: {subject}\n"
        f"---\n"
        f"{body_text}\n"
        f"{'--- HTML ---' if body_html else ''}\n"
        f"{body_html if body_html else ''}\n"
        f"{'=' * 60}\n"
    )
    _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(str(_LOG_PATH), "a", encoding="utf-8") as f:
        f.write(log_entry)

    # ── Try sendmail if available (Linux/macOS) ────────────────────────────
    if os.name != "nt":  # not Windows
        try:
            sendmail = subprocess.Popen(
                ["sendmail", "-t", "-oi"],
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            message = (
                f"From: vibesafe@vibesafe.store\r\n"
                f"To: {to_email}\r\n"
                f"Subject: {subject}\r\n"
                f"MIME-Version: 1.0\r\n"
                f"Content-Type: text/plain; charset=utf-8\r\n"
                f"\r\n"
                f"{body_text}\r\n"
            )
            sendmail.communicate(input=message.encode("utf-8"), timeout=10)
            if sendmail.returncode == 0:
                logger.info("Email sent via sendmail to %s", to_email)
                return True
        except FileNotFoundError:
            logger.debug("sendmail not available — email logged to %s", _LOG_PATH)
        except Exception as e:
            logger.warning("sendmail failed for %s: %s", to_email, e)

    logger.info("Email logged to %s (to=%s, subject=%s)", _LOG_PATH, to_email, subject)
    return True  # "accepted" in dev mode


def process_pending_emails() -> int:
    """Process all pending emails in the queue. Returns count sent."""
    pending = get_pending_emails(limit=50)
    sent = 0
    for email in pending:
        try:
            ok = send_email(
                to_email=email["to_email"],
                subject=email["subject"],
                body_text=email["body_text"],
                body_html=email.get("body_html") or "",
            )
            if ok:
                mark_email_sent(email["id"])
                sent += 1
        except Exception as e:
            logger.error("Failed to send email %d: %s", email["id"], e)
    return sent


def send_scan_notification(to_email: str, repo_url: str, scan_id: int, findings_count: int) -> None:
    """Queue a scan notification email for a monitored repo."""
    subject = f"VibeSafe Weekly Scan — {repo_url} — {findings_count} issue(s)"
    body_text = (
        f"Hi,\n\n"
        f"Your weekly VibeSafe scan for {repo_url} has completed.\n\n"
        f"Findings: {findings_count} issue(s) found.\n"
        f"View full report: /dashboard?scan={scan_id}\n\n"
        f"— VibeSafe Team\n"
    )
    queue_email(to_email, subject, body_text)


def send_welcome_email(to_email: str, repo_url: str, monitor_id: int) -> None:
    """Queue a welcome email when someone registers a monitor."""
    subject = "VibeSafe Monitoring Activated"
    body_text = (
        f"Hi,\n\n"
        f"Your repo {repo_url} is now being monitored by VibeSafe.\n\n"
        f"We'll scan it weekly and email you if we find new security issues.\n\n"
        f"Monitor ID: {monitor_id}\n"
        f"Dashboard: /dashboard\n\n"
        f"— VibeSafe Team\n"
    )
    queue_email(to_email, subject, body_text)
