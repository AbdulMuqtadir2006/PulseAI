from __future__ import annotations

from fastapi import APIRouter, Depends

from .. import db
from ..deps import require_user

router = APIRouter()


@router.get("/alerts")
def list_alerts(user: dict = Depends(require_user)):
    return db.fetch_all(
        "SELECT * FROM alert_events WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100",
        (user["id"],),
    )
