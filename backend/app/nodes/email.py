"""Email node - sends email via Resend."""

from __future__ import annotations

from typing import Any

from app.graph.state import GraphState
from app.logging_config import get_logger
from app.nodes.base import resolve, write_output
from app.settings import get_settings

log = get_logger("flowagent.node.email")


async def send_email(to: str, subject: str, html: str) -> str:
    settings = get_settings()
    if not settings.email_enabled:
        log.warning("email.no_api_key", to=to, subject=subject)
        return "[mock email - set RESEND_API_KEY to actually send]"

    import resend

    resend.api_key = settings.resend_api_key
    try:
        result = resend.Emails.send(
            {
                "from": settings.resend_from_email,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
    except Exception as exc:
        log.warning("email.failed", to=to, error=str(exc))
        return f"[email failed: {exc}]"

    log.info("email.sent", to=to, id=result.get("id"))
    return f"sent:{result.get('id')}"


async def handle(state: GraphState, config: dict[str, Any]) -> dict[str, Any]:
    to = resolve(config.get("to", ""), state)
    subject = resolve(config.get("subject", ""), state)
    body = resolve(config.get("bodyTemplate", ""), state)
    status = await send_email(to, subject, body)
    return write_output({"outputVar": "email"}, status)
