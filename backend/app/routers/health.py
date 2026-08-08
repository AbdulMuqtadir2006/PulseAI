from __future__ import annotations

from fastapi import APIRouter

from .. import config, db

router = APIRouter()


@router.get("/api/health")
def health() -> dict:
    try:
        users = db.fetch_one("SELECT COUNT(*) AS c FROM users")
        db_ok = True
    except Exception:
        users, db_ok = None, False
    return {
        "ok": True,
        "db_ok": db_ok,
        "ai_enabled": config.AI_ENABLED,
        "emergency_notify_enabled": config.EMERGENCY_NOTIFY_ENABLED,
        "model": config.OPENROUTER_MODEL,
        "users": users["c"] if users else None,
    }
