"""Deterministic narrative used when OpenRouter is unavailable — the risk
score and level always come from risk_engine.py either way; this only
covers the plain-language explanation."""
from __future__ import annotations

from typing import Any

LEVEL_LINE = {
    "low": "Your vitals are sitting comfortably inside typical adult reference ranges right now.",
    "moderate": "A couple of your vitals are drifting outside typical ranges — worth keeping an eye on.",
    "high": "Several vitals are notably outside typical ranges. This pattern is worth acting on soon.",
    "critical": "One or more vitals are far outside a safe range. This is exactly the pattern PulseGuard AI is built to catch early.",
}

LEVEL_RECOMMENDATION = {
    "low": "No action needed — keep wearing the device and check back at your next reading.",
    "moderate": "Rest, rehydrate, and recheck shortly. If it doesn't settle, mention it to a doctor.",
    "high": "Sit down, stay calm, and contact a healthcare professional soon rather than waiting it out.",
    "critical": "This is treated as a possible emergency — your listed emergency contacts are being notified. If you're able to, call your local emergency number now.",
}


def narrative(risk: dict[str, Any]) -> dict[str, Any]:
    level = risk["risk_level"]
    watch = [k for k, v in risk["biomarkers"].items() if v["status"] != "good"]
    watch_txt = f" The readings driving this are: {', '.join(watch)}." if watch else ""
    return {
        "narrative": LEVEL_LINE.get(level, LEVEL_LINE["low"]) + watch_txt,
        "recommendation": LEVEL_RECOMMENDATION.get(level, LEVEL_RECOMMENDATION["low"]),
        "source": "fallback",
    }
