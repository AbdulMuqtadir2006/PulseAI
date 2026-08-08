"""Plausible vitals generator — there's no real wearable feeding this app,
so readings are simulated. `scenario` picks a band to sample from; "critical"
is a deliberate demo control for showing the alert pipeline fire, not a
random occurrence."""
from __future__ import annotations

import random

# (low, high) sampling bands per scenario. "elevated" sits in the
# watch/high-risk zone without necessarily crossing a hard critical bound;
# "critical" deliberately breaches core.risk_engine.CRITICAL_BOUNDS.
SCENARIOS: dict[str, dict[str, tuple[float, float]]] = {
    "normal": {
        "heart_rate": (62, 88),
        "hrv": (42, 82),
        "spo2": (96, 99),
        "systolic": (106, 122),
        "diastolic": (66, 79),
    },
    "elevated": {
        "heart_rate": (104, 128),
        "hrv": (16, 27),
        "spo2": (92, 95),
        "systolic": (136, 152),
        "diastolic": (86, 96),
    },
    "critical": {
        "heart_rate": (156, 178),
        "hrv": (6, 14),
        "spo2": (82, 89),
        "systolic": (186, 205),
        "diastolic": (108, 122),
    },
}


def _round(v: float, dp: int) -> float:
    f = 10**dp
    return round(v * f) / f


def generate_reading(scenario: str = "normal") -> dict[str, float]:
    band = SCENARIOS.get(scenario, SCENARIOS["normal"])
    return {
        "heart_rate": _round(random.uniform(*band["heart_rate"]), 0),
        "hrv": _round(random.uniform(*band["hrv"]), 0),
        "spo2": _round(random.uniform(*band["spo2"]), 0),
        "systolic": _round(random.uniform(*band["systolic"]), 0),
        "diastolic": _round(random.uniform(*band["diastolic"]), 0),
    }
