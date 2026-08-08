"""Ties the agent steps together for one incoming reading: Capture (store
the reading) -> Analysis (risk_engine) -> Guidance (insight_llm narrative)
-> dispatch (emergency_notify, only when risk_level is "critical"). This is
the same shape the marketing site's 3D pipeline visualization shows."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from .. import db
from . import emergency_notify, insight_llm, risk_engine


def _row_to_reading(row: dict) -> dict[str, Any]:
    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "heart_rate": row["heart_rate"],
        "hrv": row["hrv"],
        "spo2": row["spo2"],
        "systolic": row["systolic"],
        "diastolic": row["diastolic"],
        "scenario": row["scenario"],
    }


def run_pipeline(user_id: int, values: dict[str, float], scenario: str = "normal") -> dict[str, Any]:
    # Capture
    now = datetime.now(timezone.utc).isoformat()
    reading_id = db.execute(
        """
        INSERT INTO vitals_readings (user_id, "timestamp", heart_rate, hrv, spo2, systolic, diastolic, scenario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, now, values["heart_rate"], values["hrv"], values["spo2"], values["systolic"], values["diastolic"], scenario),
    )
    reading = _row_to_reading(db.fetch_one("SELECT * FROM vitals_readings WHERE id = ?", (reading_id,)))

    # Analysis
    risk = risk_engine.evaluate(values)

    # Guidance (narrative)
    insight = insight_llm.generate(reading, risk)

    risk_assessment_id = db.execute(
        """
        INSERT INTO risk_assessments (reading_id, user_id, risk_score, risk_level, factors_json, narrative, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            reading_id,
            user_id,
            risk["risk_score"],
            risk["risk_level"],
            json.dumps(risk["biomarkers"]),
            f"{insight['narrative']} {insight['recommendation']}".strip(),
            insight["source"],
        ),
    )

    # Dispatch — only fan out to emergency contacts on a critical reading.
    alerts_fired: list[dict[str, Any]] = []
    if risk["risk_level"] == "critical":
        contacts = db.fetch_all("SELECT * FROM emergency_contacts WHERE user_id = ?", (user_id,))
        message = (
            f"PulseGuard AI alert: a critical-risk reading was detected (score {risk['risk_score']}/100). "
            f"{insight['narrative']}"
        )
        for contact in contacts:
            result = emergency_notify.notify(contact, message)
            db.execute(
                """
                INSERT INTO alert_events (user_id, reading_id, risk_assessment_id, channel, recipient, message, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, reading_id, risk_assessment_id, result["channel"], contact["phone"], message, result["status"]),
            )
            alerts_fired.append({"contact": contact["name"], **result})

    return {
        "reading": reading,
        "risk": {
            "id": risk_assessment_id,
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "biomarkers": risk["biomarkers"],
            "narrative": insight["narrative"],
            "recommendation": insight["recommendation"],
            "source": insight["source"],
        },
        "alerts_fired": alerts_fired,
    }
