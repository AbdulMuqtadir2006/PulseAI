"""Deterministic cardiac-risk scoring engine.

Same shape as a reference-range screening heuristic, not a trained clinical
model — deliberate, and disclosed everywhere in the UI. A single call here
turns five vitals into a risk score explainable metric-by-metric; the
OpenRouter call in insight_llm.py only narrates these numbers in plain
language, it never invents the score itself.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

BIOMARKERS = ("heart_rate", "hrv", "spo2", "systolic", "diastolic")


@dataclass(frozen=True)
class RangeSpec:
    min_value: float
    max_value: float
    weight: float


# General adult reference bands — a screening heuristic, not diagnostic-grade
# clinical thresholds. HRV varies hugely by age/fitness in reality; this is a
# deliberately generic band for a demo, not a personalised baseline.
REFERENCE_RANGES: dict[str, RangeSpec] = {
    "heart_rate": RangeSpec(60.0, 100.0, 1.0),
    "hrv": RangeSpec(25.0, 100.0, 0.8),
    "spo2": RangeSpec(95.0, 100.0, 1.4),
    "systolic": RangeSpec(90.0, 120.0, 1.0),
    "diastolic": RangeSpec(60.0, 80.0, 0.8),
}

# A single metric past these bounds forces "critical" regardless of the
# composite score — mirrors how real triage works, where one severely
# abnormal vital overrides an otherwise-okay-looking average.
CRITICAL_BOUNDS: dict[str, tuple[float, float]] = {
    "heart_rate": (40.0, 150.0),
    "spo2": (90.0, 101.0),
    "systolic": (80.0, 180.0),
    "diastolic": (40.0, 120.0),
}


def _value_fit(value: float, spec: RangeSpec) -> tuple[float, str]:
    width = max(spec.max_value - spec.min_value, 1e-9)
    if spec.min_value <= value <= spec.max_value:
        midpoint = (spec.min_value + spec.max_value) / 2.0
        half_width = width / 2.0
        centrality = 1.0 - min(abs(value - midpoint) / max(half_width, 1e-9), 1.0)
        return 0.85 + 0.15 * centrality, "good"

    distance = spec.min_value - value if value < spec.min_value else value - spec.max_value
    normalized_deviation = distance / width
    score = max(0.0, 0.85 - normalized_deviation)
    status = "watch" if normalized_deviation <= 0.2 else "critical"
    return score, status


def evaluate(values: dict[str, float]) -> dict[str, Any]:
    weighted_total = 0.0
    total_weight = 0.0
    details: dict[str, Any] = {}
    forced_critical = False

    for key in BIOMARKERS:
        spec = REFERENCE_RANGES[key]
        value = float(values[key])
        score, status = _value_fit(value, spec)
        weighted_total += score * spec.weight
        total_weight += spec.weight
        details[key] = {
            "value": value,
            "min": spec.min_value,
            "max": spec.max_value,
            "fit": round(score, 4),
            "status": status,
        }
        bounds = CRITICAL_BOUNDS.get(key)
        if bounds and not (bounds[0] <= value <= bounds[1]):
            forced_critical = True

    range_score = weighted_total / max(total_weight, 1e-9)
    risk_score = round((1.0 - range_score) * 100, 1)

    if forced_critical:
        risk_level = "critical"
        risk_score = max(risk_score, 85.0)
    elif risk_score >= 55:
        risk_level = "high"
    elif risk_score >= 28:
        risk_level = "moderate"
    else:
        risk_level = "low"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "range_score": round(range_score, 4),
        "biomarkers": details,
    }


# ---- health areas ----
# Groups the 5 raw biomarkers into 3 physiological areas for the content
# agents (voice/report/self-care) — same "worst status wins" grouping
# Novera's reference_data.py uses for its 4 saliva-screening areas, adapted
# to cardiac vitals. Kept separate from the risk_score/risk_level above:
# those drive the emergency-alert pipeline, areas are purely for
# plain-language narrative agents to talk about the reading by region.
AREA_IDS = ("rhythm", "oxygen", "pressure")

_STATUS_RANK = {"good": 0, "watch": 1, "critical": 2}


def _worst_status(a: str, b: str) -> str:
    return a if _STATUS_RANK[a] >= _STATUS_RANK[b] else b


def health_areas(biomarkers: dict[str, Any]) -> dict[str, str]:
    return {
        "rhythm": _worst_status(biomarkers["heart_rate"]["status"], biomarkers["hrv"]["status"]),
        "oxygen": biomarkers["spo2"]["status"],
        "pressure": _worst_status(biomarkers["systolic"]["status"], biomarkers["diastolic"]["status"]),
    }
