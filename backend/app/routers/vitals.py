from __future__ import annotations

import json

from fastapi import APIRouter, Depends

from .. import db
from ..core import demo_data, pipeline
from ..deps import require_user
from ..schemas import SimulateReq

router = APIRouter()


def _row_with_risk(reading_row: dict) -> dict:
    risk_row = db.fetch_one(
        "SELECT * FROM risk_assessments WHERE reading_id = ? ORDER BY id DESC LIMIT 1",
        (reading_row["id"],),
    )
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
    if risk_row:
        reading["risk"] = {
            "risk_score": risk_row["risk_score"],
            "risk_level": risk_row["risk_level"],
            "biomarkers": json.loads(risk_row["factors_json"]),
            "narrative": risk_row["narrative"],
            "source": risk_row["source"],
        }
    else:
        reading["risk"] = None
    return reading


@router.get("/vitals/latest")
def latest(user: dict = Depends(require_user)):
    row = db.fetch_one(
        'SELECT * FROM vitals_readings WHERE user_id = ? ORDER BY "timestamp" DESC, id DESC LIMIT 1',
        (user["id"],),
    )
    if not row:
        # First visit — bootstrap with one normal reading so the dashboard
        # isn't empty before the user has clicked "simulate" themselves.
        result = pipeline.run_pipeline(user["id"], demo_data.generate_reading("normal"), "normal")
        return {**result["reading"], "risk": result["risk"]}
    return _row_with_risk(row)


@router.get("/vitals")
def history(hours: int = 24, user: dict = Depends(require_user)):
    hours = max(1, min(24 * 30, hours))
    rows = db.fetch_all(
        """
        SELECT * FROM vitals_readings
        WHERE user_id = ? AND "timestamp" >= datetime('now', ?)
        ORDER BY "timestamp" ASC, id ASC
        """,
        (user["id"], f"-{hours} hours"),
    )
    return [_row_with_risk(r) for r in rows]


@router.post("/vitals/simulate", status_code=201)
def simulate(body: SimulateReq, user: dict = Depends(require_user)):
    values = demo_data.generate_reading(body.scenario)
    result = pipeline.run_pipeline(user["id"], values, body.scenario)
    return {**result["reading"], "risk": result["risk"], "alerts_fired": result["alerts_fired"]}
