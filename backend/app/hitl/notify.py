"""Builds and sends the approval email with signed approve/deny links."""

from __future__ import annotations

from app.hitl.sign import make_token
from app.nodes.email import send_email
from app.settings import get_settings


def _link(run_id: str, decision: str, ttl_seconds: int) -> str:
    token = make_token(run_id, decision, ttl_seconds)
    base = get_settings().api_base_url
    return f"{base}/approve/{token}"


async def send_approval_request(
    run_id: str, approver_email: str, message: str, timeout_hours: int
) -> None:
    ttl = timeout_hours * 3600
    approve_url = _link(run_id, "approved", ttl)
    deny_url = _link(run_id, "denied", ttl)

    html = (
        f"<p>{message}</p>"
        f'<p><a href="{approve_url}">Approve</a> &nbsp;|&nbsp; '
        f'<a href="{deny_url}">Deny</a></p>'
    )
    await send_email(approver_email, "FlowAgent - approval needed", html)
