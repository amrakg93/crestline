"""
SQLite database layer for VibeSafe backend.

Stores scan results, monitored repos, and user registrations.
Uses Python stdlib sqlite3 — no ORM, no dependencies.
"""

import sqlite3
import json
import os
from datetime import datetime, timezone
from pathlib import Path

_DB_PATH = Path(__file__).parent / "vibesafe.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    """Create tables if they don't exist."""
    conn = _get_conn()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS scans (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                repo_url    TEXT,
                url         TEXT,
                email       TEXT,
                status      TEXT NOT NULL DEFAULT 'pending',
                summary     TEXT,
                findings    TEXT,
                report_md   TEXT,
                badge_html  TEXT,
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                completed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS monitors (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                repo_url    TEXT NOT NULL,
                url         TEXT,
                email       TEXT,
                last_scan_id INTEGER,
                is_active   INTEGER NOT NULL DEFAULT 1,
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (last_scan_id) REFERENCES scans(id)
            );

            CREATE TABLE IF NOT EXISTS email_queue (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                to_email    TEXT NOT NULL,
                subject     TEXT NOT NULL,
                body_text   TEXT,
                body_html   TEXT,
                status      TEXT NOT NULL DEFAULT 'pending',
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                sent_at     TEXT
            );
        """)
        conn.commit()
    finally:
        conn.close()


# ── Scans ──────────────────────────────────────────────────────────────────────


def insert_scan(
    repo_url: str | None = None,
    url: str | None = None,
    email: str | None = None,
) -> int:
    """Insert a new scan record and return its ID."""
    conn = _get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO scans (repo_url, url, email) VALUES (?, ?, ?)",
            (repo_url, url, email),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def update_scan_result(
    scan_id: int,
    status: str,
    summary: str = "",
    findings: list | None = None,
    report_md: str = "",
    badge_html: str = "",
) -> None:
    """Update a scan with results."""
    conn = _get_conn()
    try:
        conn.execute(
            """UPDATE scans
               SET status=?, summary=?, findings=?, report_md=?, badge_html=?,
                   completed_at=datetime('now')
               WHERE id=?""",
            (
                status,
                summary,
                json.dumps(findings or []),
                report_md,
                badge_html,
                scan_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_scan(scan_id: int) -> dict | None:
    """Get a single scan by ID."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM scans WHERE id=?", (scan_id,)).fetchone()
        if row is None:
            return None
        d = dict(row)
        if d.get("findings"):
            d["findings"] = json.loads(d["findings"])
        return d
    finally:
        conn.close()


def list_scans(limit: int = 50, offset: int = 0) -> list[dict]:
    """List scans newest first."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM scans ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# ── Monitors ────────────────────────────────────────────────────────────────────


def register_monitor(
    repo_url: str,
    url: str | None = None,
    email: str | None = None,
) -> int:
    """Register a repo for weekly auto-scans. Returns monitor ID."""
    conn = _get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO monitors (repo_url, url, email) VALUES (?, ?, ?)",
            (repo_url, url, email),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def get_monitor(monitor_id: int) -> dict | None:
    """Get monitor details."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM monitors WHERE id=?", (monitor_id,)).fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        conn.close()


def list_monitors(is_active: bool = True) -> list[dict]:
    """List all active (or inactive) monitors."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM monitors WHERE is_active=? ORDER BY created_at DESC",
            (1 if is_active else 0,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def update_monitor_last_scan(monitor_id: int, scan_id: int) -> None:
    """Link a monitor to its most recent scan."""
    conn = _get_conn()
    try:
        conn.execute(
            "UPDATE monitors SET last_scan_id=? WHERE id=?",
            (scan_id, monitor_id),
        )
        conn.commit()
    finally:
        conn.close()


def deactivate_monitor(monitor_id: int) -> bool:
    """Mark a monitor as inactive. Returns True if found."""
    conn = _get_conn()
    try:
        cur = conn.execute(
            "UPDATE monitors SET is_active=0 WHERE id=?",
            (monitor_id,),
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


# ── Email Queue ────────────────────────────────────────────────────────────────


def queue_email(to_email: str, subject: str, body_text: str, body_html: str = "") -> int:
    """Add an email to the outbound queue."""
    conn = _get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO email_queue (to_email, subject, body_text, body_html) VALUES (?, ?, ?, ?)",
            (to_email, subject, body_text, body_html),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def get_pending_emails(limit: int = 20) -> list[dict]:
    """Get pending emails to send."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM email_queue WHERE status='pending' ORDER BY created_at ASC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def mark_email_sent(email_id: int) -> None:
    """Mark an email as sent."""
    conn = _get_conn()
    try:
        conn.execute(
            "UPDATE email_queue SET status='sent', sent_at=datetime('now') WHERE id=?",
            (email_id,),
        )
        conn.commit()
    finally:
        conn.close()
