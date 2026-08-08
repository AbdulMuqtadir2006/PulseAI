"""Emergency-contact notification — simulated unless a real provider is
configured. Never claim a message was actually sent when it wasn't; the
UI must be able to trust `status` to tell the truth."""
from __future__ import annotations

from typing import Any
from urllib import request as urlrequest
from urllib.error import URLError

from .. import config


def notify(contact: dict[str, Any], message: str) -> dict[str, Any]:
    if not config.EMERGENCY_NOTIFY_ENABLED:
        return {
            "status": "simulated",
            "channel": "simulated",
            "detail": "No EMERGENCY_WEBHOOK_URL configured — this alert was logged only, nothing was actually sent.",
        }

    payload = {"to": contact.get("phone"), "name": contact.get("name"), "message": message}
    try:
        body = __import__("json").dumps(payload).encode("utf-8")
        req = urlrequest.Request(
            config.EMERGENCY_WEBHOOK_URL,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlrequest.urlopen(req, timeout=10) as resp:  # noqa: S310 - operator-configured URL
            ok = 200 <= resp.status < 300
        return {
            "status": "sent" if ok else "failed",
            "channel": "webhook",
            "detail": f"POSTed to configured webhook (HTTP {resp.status}).",
        }
    except URLError as exc:
        return {"status": "failed", "channel": "webhook", "detail": f"Webhook request failed: {exc}"}
