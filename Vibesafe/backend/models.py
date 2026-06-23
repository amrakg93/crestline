"""
Pydantic models for VibeSafe API request/response validation.
"""

from pydantic import BaseModel, Field, EmailStr


class ScanRequest(BaseModel):
    """Request to trigger a security scan."""
    repo_url: str | None = Field(
        default=None,
        description="Path to source code repo (for pre-launch scan)",
    )
    url: str | None = Field(
        default=None,
        description="Live URL to scan (for post-launch scan)",
    )
    email: str | None = Field(
        default=None,
        description="Email for breach check",
    )


class ShieldRequest(BaseModel):
    """Request to generate a shield file."""
    stack: str = Field(
        ...,
        description="Stack key (e.g. lovable-supabase, bolt-firebase)",
    )
    output: str = Field(
        default="CLAUDE.md",
        description="Output filename for the shield",
    )


class MonitorRequest(BaseModel):
    """Request to register a repo for weekly auto-scans."""
    repo_url: str = Field(
        ...,
        description="GitHub repo URL to monitor",
    )
    url: str | None = Field(
        default=None,
        description="Optional live URL to scan post-launch",
    )
    email: str = Field(
        ...,
        description="Email address for weekly notifications",
    )


class ScanResponse(BaseModel):
    """Scan result returned to the client."""
    id: int
    status: str
    summary: str = ""
    findings: list = []
    report_md: str = ""
    badge_html: str = ""
    repo_url: str | None = None
    url: str | None = None
    created_at: str
    completed_at: str | None = None
