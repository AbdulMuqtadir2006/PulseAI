"""The one AI call in this app: turns a risk_engine.py result into a
plain-language narrative + recommendation. Always succeeds — falls back to
a deterministic explanation (fallbacks.py) if OpenRouter is unavailable or
returns something that doesn't validate."""
from __future__ import annotations

import json
import re
from typing import Any

from langchain_openai import ChatOpenAI

from .. import config
from ..schemas import RiskNarrativeOut
from . import fallbacks


class LLMError(RuntimeError):
    pass


def _make_llm() -> ChatOpenAI:
    if not config.AI_ENABLED:
        raise LLMError("OPENROUTER_API_KEY not configured (must start with sk-or-).")
    return ChatOpenAI(
        model=config.OPENROUTER_MODEL,
        api_key=config.OPENROUTER_API_KEY,
        base_url=config.OPENROUTER_BASE_URL,
        temperature=0.35,
        timeout=config.OPENROUTER_TIMEOUT_SECONDS,
        max_retries=1,
        max_tokens=700,
        default_headers={"HTTP-Referer": "http://localhost", "X-Title": "PulseGuard AI"},
    )


def _extract_json(text: str) -> dict:
    if not text:
        raise LLMError("Empty model response.")
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else None
    if candidate is None:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise LLMError("No JSON object found in model response.")
        candidate = text[start : end + 1]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError as exc:
        raise LLMError(f"Model returned invalid JSON: {exc}") from exc


def _describe_reading(reading: dict[str, Any], risk: dict[str, Any]) -> str:
    lines = []
    for key, detail in risk["biomarkers"].items():
        lines.append(f"- {key}: {detail['value']} (reference {detail['min']}-{detail['max']}, status: {detail['status']})")
    return (
        f"Risk score: {risk['risk_score']}/100 ({risk['risk_level']})\n"
        f"Reading at {reading.get('timestamp', 'now')}:\n" + "\n".join(lines)
    )


def generate(reading: dict[str, Any], risk: dict[str, Any]) -> dict[str, Any]:
    schema = json.dumps(RiskNarrativeOut.model_json_schema(), ensure_ascii=False)
    system = (
        "You are PulseGuard AI's Insight Agent. Given a cardiac risk score and its underlying "
        "vitals, write a short, calm, plain-language explanation (3-5 sentences) of what's going "
        "on and one concrete recommendation. This is a research-stage screening heuristic, not a "
        "diagnosis — never claim certainty, never name a specific medical condition. "
        f"Respond with ONE valid JSON object only, matching this schema:\n{schema}"
    )
    try:
        llm = _make_llm()
        response = llm.invoke(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": _describe_reading(reading, risk)},
            ]
        )
        data = _extract_json(str(response.content))
        out = RiskNarrativeOut.model_validate(data)
        result = out.model_dump()
        result["source"] = "ai"
        return result
    except Exception as exc:  # any LLM/validation failure degrades gracefully
        print(f"[insight] fallback: {exc}")
        return fallbacks.narrative(risk)
