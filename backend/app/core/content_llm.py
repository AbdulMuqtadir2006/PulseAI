"""Content agents — voice / report / self-care / chat.

Each makes exactly one OpenRouter call (via ChatOpenAI) and always succeeds,
falling back to deterministic bilingual output (fallbacks.py) if the LLM is
unavailable or returns something that doesn't validate. Same shape as
insight_llm.py's single risk-narrative agent, generalized to 4 schemas via
structured_json_call() — ported from a sibling project (Novera) that uses
this exact pattern for a saliva-screening app; adapted here to PulseGuard's
cardiac vitals and 3-area grouping (risk_engine.health_areas) instead of
Novera's 4 saliva biomarker areas.
"""
from __future__ import annotations

import json
import re
from typing import Any, Type, TypeVar

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, ValidationError

from .. import config
from ..schemas import ChatOut, ReportOut, SelfCareOut, VoiceOut
from . import fallbacks, risk_engine

T = TypeVar("T", bound=BaseModel)


class LLMError(RuntimeError):
    pass


def _make_llm(temperature: float = 0.3, max_tokens: int = 1200) -> ChatOpenAI:
    if not config.AI_ENABLED:
        raise LLMError("OPENROUTER_API_KEY not configured (must start with sk-or-).")
    return ChatOpenAI(
        model=config.OPENROUTER_MODEL,
        api_key=config.OPENROUTER_API_KEY,
        base_url=config.OPENROUTER_BASE_URL,
        temperature=temperature,
        timeout=config.OPENROUTER_TIMEOUT_SECONDS,
        max_retries=1,
        max_tokens=max_tokens,
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


def structured_json_call(
    system: str, user: str, model_cls: Type[T], temperature: float = 0.3, max_tokens: int = 1400
) -> T:
    schema = json.dumps(model_cls.model_json_schema(), ensure_ascii=False)
    full_system = (
        f"{system}\n\nRespond with ONE valid JSON object only — no prose, no markdown, no code "
        f"fences. It must match this JSON schema (keys and types):\n{schema}"
    )
    llm = _make_llm(temperature=temperature, max_tokens=max_tokens)
    try:
        response = llm.invoke([{"role": "system", "content": full_system}, {"role": "user", "content": user}])
    except Exception as exc:
        raise LLMError(f"LLM call failed: {exc}") from exc

    data = _extract_json(str(response.content))
    try:
        return model_cls.model_validate(data)
    except ValidationError as exc:
        raise LLMError(f"Model output failed validation: {exc}") from exc


def _lang_name(lang: str) -> str:
    return "Arabic" if lang == "ar" else "English"


def _describe_reading(reading: dict[str, Any], risk: dict[str, Any]) -> str:
    lines = []
    for key, detail in risk["biomarkers"].items():
        lines.append(f"- {key}: {detail['value']} (reference {detail['min']}-{detail['max']}, status: {detail['status']})")
    areas = risk_engine.health_areas(risk["biomarkers"])
    areas_txt = ", ".join(f"{a}: {s}" for a, s in areas.items())
    return (
        f"Reading at {reading.get('timestamp', 'now')}. Risk score: {risk['risk_score']}/100 ({risk['risk_level']}).\n"
        f"Biomarkers:\n" + "\n".join(lines) + f"\nHealth areas — {areas_txt}"
    )


def _describe_context(ctx: dict[str, Any]) -> str:
    if not ctx or not (ctx.get("diagnosis") or ctx.get("medications") or ctx.get("notes")):
        return "No doctor-provided context has been shared yet."
    parts = []
    if ctx.get("diagnosis"):
        parts.append(f"Doctor's diagnosis: {ctx['diagnosis']}")
    if ctx.get("medications"):
        parts.append(f"Medications: {ctx['medications']}")
    if ctx.get("notes"):
        parts.append(f"Other notes: {ctx['notes']}")
    return "\n".join(parts)


def voice_agent(reading: dict[str, Any], risk: dict[str, Any], lang: str = "en") -> dict[str, Any]:
    try:
        out = structured_json_call(
            system=(
                f"You are PulseGuard AI's Guidance Agent. Write a spoken cardiac screening SUMMARY (not a "
                f"diagnosis) to be read aloud by a text-to-speech voice, entirely in {_lang_name(lang)}. Warm, "
                f"clear, 5-8 flowing sentences, no markdown or bullets. Always note it is research-stage, not "
                f"medical advice."
            ),
            user=f"Compose the spoken summary from this reading:\n{_describe_reading(reading, risk)}",
            model_cls=VoiceOut,
            max_tokens=900,
        )
        return {"script": out.script, "source": "ai"}
    except LLMError as exc:
        print(f"[voice] fallback: {exc}")
        return fallbacks.voice(reading, risk, lang)


def report_agent(reading: dict[str, Any], risk: dict[str, Any], ctx: dict[str, Any], lang: str = "en") -> dict[str, Any]:
    try:
        out = structured_json_call(
            system=(
                f"You are PulseGuard AI's Insight Agent producing a plain-language cardiac screening report in "
                f"{_lang_name(lang)}. It is a screening summary, NOT a diagnosis. Cover all three health areas "
                f"using these exact ids: rhythm, oxygen, pressure. If the patient shared doctor context, take it "
                f"into account gently. Keep each area note 1-2 sentences."
            ),
            user=f"{_describe_reading(reading, risk)}\n\nPatient context:\n{_describe_context(ctx)}",
            model_cls=ReportOut,
            max_tokens=1400,
        )
        data = out.model_dump()
        # The LLM isn't reliably constrained to the good/watch/critical enum
        # the frontend colors by (it might paraphrase "elevated" or similar)
        # — status always comes from our own deterministic scoring, never
        # the model's word choice. Only id/name/note are the LLM's to write.
        areas_status = risk_engine.health_areas(risk["biomarkers"])
        for area in data["areas"]:
            if area.get("id") in areas_status:
                area["status"] = areas_status[area["id"]]
        data["disclaimer"] = fallbacks.RESEARCH_LINE.get(lang, fallbacks.RESEARCH_LINE["en"])
        data["source"] = "ai"
        return data
    except LLMError as exc:
        print(f"[report] fallback: {exc}")
        return fallbacks.report(reading, risk, lang)


def self_care_agent(
    reading: dict[str, Any], risk: dict[str, Any], ctx: dict[str, Any], chat_history: list[dict[str, Any]], lang: str = "en"
) -> dict[str, Any]:
    convo = "\n".join(f"{'Patient' if m['role'] == 'user' else 'Assistant'}: {m['content']}" for m in (chat_history or []))
    try:
        out = structured_json_call(
            system=(
                f"You are PulseGuard AI's Guidance Agent, a supportive wellness coach writing in {_lang_name(lang)}. "
                f"Produce a practical, personalised diet plan and self-care guidance from the cardiac vitals "
                f"reading, the doctor's context, and the conversation. General wellness guidance, not medical "
                f"treatment. Respect any diagnosis/medications (e.g. if hypertension-related, favour "
                f"lower-sodium, heart-healthy choices). Keep meals concrete and simple. Use area ids: rhythm, "
                f"oxygen, pressure. ALSO include a 'nutrition' list with one entry per meal (breakfast, lunch, "
                f"dinner, snacks) giving realistic estimated calories, protein_g, carbs_g, fat_g, and 1-3 short "
                f"'micros' highlights. Meal descriptions and micros must be in {_lang_name(lang)}."
            ),
            user=(
                f"{_describe_reading(reading, risk)}\n\nPatient context:\n{_describe_context(ctx)}\n\n"
                f"Conversation so far:\n{convo or '(none)'}\n\n"
                f"Produce today's focus, a full diet plan (breakfast/lunch/dinner/snacks/hydration), one tip per "
                f"health area, and the nutrition breakdown for breakfast, lunch, dinner and snacks."
            ),
            model_cls=SelfCareOut,
            max_tokens=2200,
            temperature=0.4,
        )
        data = out.model_dump()
        areas_status = risk_engine.health_areas(risk["biomarkers"])
        for tip in data["areaTips"]:
            if tip.get("id") in areas_status:
                tip["status"] = areas_status[tip["id"]]
        data["source"] = "ai"
        if not data.get("nutrition"):
            data["nutrition"] = fallbacks.self_care(reading, risk, lang)["nutrition"]
        return data
    except LLMError as exc:
        print(f"[self_care] fallback: {exc}")
        return fallbacks.self_care(reading, risk, lang)


def chat_agent(
    messages: list[dict[str, Any]], reading: dict[str, Any] | None, risk: dict[str, Any] | None, ctx: dict[str, Any], lang: str = "en"
) -> dict[str, Any]:
    convo = "\n".join(f"{'Patient' if m['role'] == 'user' else 'Assistant'}: {m['content']}" for m in messages)
    reading_txt = _describe_reading(reading, risk) if reading and risk else "No reading available."
    try:
        out = structured_json_call(
            system=(
                f"You are PulseGuard AI's Guidance Agent chatting with a patient in {_lang_name(lang)}. The "
                f"patient tells you what their doctor said — diagnosis, medications, instructions. Be warm and "
                f"concise (2-4 sentences), and ask a gentle follow-up when useful. MAINTAIN a running structured "
                f"record: return the FULL updated diagnosis / medications / notes (merge new info with prior — "
                f"never lose earlier info). Set contextChanged true only if you added or changed something. "
                f"Never give a medical diagnosis yourself. The reply must be in {_lang_name(lang)}, but keep "
                f"diagnosis/medications/notes in concise English."
            ),
            user=(
                f"Current stored context:\nDiagnosis: {ctx.get('diagnosis') or '(none)'}\n"
                f"Medications: {ctx.get('medications') or '(none)'}\nNotes: {ctx.get('notes') or '(none)'}\n\n"
                f"Latest reading: {reading_txt}\n\nConversation:\n{convo}\n\n"
                f"Respond to the patient's last message and return the updated context record."
            ),
            model_cls=ChatOut,
            max_tokens=900,
            temperature=0.4,
        )
        data = out.model_dump()
        data["source"] = "ai"
        return data
    except LLMError as exc:
        print(f"[chat] fallback: {exc}")
        return fallbacks.chat(messages, ctx, lang)
