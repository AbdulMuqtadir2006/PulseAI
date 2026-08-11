"""Voice / report / self-care / chat — the content agents. Every route is
scoped to the authenticated user (unlike the sibling project this was
ported from, which has no auth and operates on one global patient)."""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..core import content_llm
from ..deps import require_user
from ..schemas import ChatSendReq, LangReq

router = APIRouter()


def _latest_reading_and_risk(user_id: int) -> tuple[dict | None, dict | None]:
    reading_row = db.fetch_one(
        'SELECT * FROM vitals_readings WHERE user_id = ? ORDER BY "timestamp" DESC, id DESC LIMIT 1',
        (user_id,),
    )
    if not reading_row:
        return None, None
    reading = {
        "id": reading_row["id"],
        "timestamp": reading_row["timestamp"],
        "heart_rate": reading_row["heart_rate"],
        "hrv": reading_row["hrv"],
        "spo2": reading_row["spo2"],
        "systolic": reading_row["systolic"],
        "diastolic": reading_row["diastolic"],
        "scenario": reading_row["scenario"],
    }
    risk_row = db.fetch_one(
        "SELECT * FROM risk_assessments WHERE reading_id = ? ORDER BY id DESC LIMIT 1",
        (reading_row["id"],),
    )
    if not risk_row:
        return reading, None
    risk = {
        "risk_score": risk_row["risk_score"],
        "risk_level": risk_row["risk_level"],
        "biomarkers": json.loads(risk_row["factors_json"]),
    }
    return reading, risk


def _get_context(user_id: int) -> dict:
    row = db.fetch_one(
        "SELECT diagnosis, medications, notes, updated_at FROM patient_context WHERE user_id = ?",
        (user_id,),
    )
    return row or {"diagnosis": "", "medications": "", "notes": ""}


def _get_chat_history(user_id: int) -> list[dict]:
    return db.fetch_all(
        "SELECT role, content, lang, created_at FROM chat_messages WHERE user_id = ? ORDER BY id ASC",
        (user_id,),
    )


@router.post("/voice-script")
def voice_script(body: LangReq, user: dict = Depends(require_user)):
    reading, risk = _latest_reading_and_risk(user["id"])
    if not reading or not risk:
        raise HTTPException(status_code=404, detail="no readings")
    return content_llm.voice_agent(reading, risk, body.lang)


@router.post("/report")
def report(body: LangReq, user: dict = Depends(require_user)):
    reading, risk = _latest_reading_and_risk(user["id"])
    if not reading or not risk:
        raise HTTPException(status_code=404, detail="no readings")
    ctx = _get_context(user["id"])
    return content_llm.report_agent(reading, risk, ctx, body.lang)


@router.post("/self-care")
def self_care(body: LangReq, user: dict = Depends(require_user)):
    reading, risk = _latest_reading_and_risk(user["id"])
    if not reading or not risk:
        raise HTTPException(status_code=404, detail="no readings")
    ctx = _get_context(user["id"])
    history = _get_chat_history(user["id"])
    return content_llm.self_care_agent(reading, risk, ctx, history, body.lang)


@router.get("/chat")
def get_chat(user: dict = Depends(require_user)):
    return {"messages": _get_chat_history(user["id"]), "context": _get_context(user["id"])}


@router.post("/chat")
def send_chat(body: ChatSendReq, user: dict = Depends(require_user)):
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="empty message")

    db.execute(
        "INSERT INTO chat_messages (user_id, role, content, lang) VALUES (?, 'user', ?, ?)",
        (user["id"], message, body.lang),
    )

    reading, risk = _latest_reading_and_risk(user["id"])
    ctx = _get_context(user["id"])
    history = _get_chat_history(user["id"])

    out = content_llm.chat_agent(history, reading, risk, ctx, body.lang)

    db.execute(
        "INSERT INTO chat_messages (user_id, role, content, lang) VALUES (?, 'assistant', ?, ?)",
        (user["id"], out["reply"], body.lang),
    )

    if out.get("contextChanged"):
        db.execute(
            """
            INSERT INTO patient_context (user_id, diagnosis, medications, notes, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (user_id) DO UPDATE SET
                diagnosis = EXCLUDED.diagnosis,
                medications = EXCLUDED.medications,
                notes = EXCLUDED.notes,
                updated_at = EXCLUDED.updated_at
            """,
            (
                user["id"],
                out.get("diagnosis", ""),
                out.get("medications", ""),
                out.get("notes", ""),
                datetime.now(timezone.utc).isoformat(),
            ),
        )

    return {
        "reply": out["reply"],
        "context": _get_context(user["id"]),
        "contextChanged": bool(out.get("contextChanged")),
        "source": out.get("source"),
    }


@router.delete("/chat")
def reset_chat(user: dict = Depends(require_user)):
    db.execute("DELETE FROM chat_messages WHERE user_id = ?", (user["id"],))
    return {"ok": True}
