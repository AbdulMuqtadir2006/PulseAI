"""Deterministic narrative used when OpenRouter is unavailable — the risk
score and level always come from risk_engine.py either way; this only
covers the plain-language explanation. Also holds the bilingual (EN/AR)
fallback templates for the voice/report/self-care/chat content agents
(content_llm.py) — same "always produce a real, readable answer" contract,
just per-agent instead of one narrative."""
from __future__ import annotations

from typing import Any

from . import risk_engine

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


# ---- bilingual content-agent fallbacks ----
# Every lookup below is {"en": {...}, "ar": {...}}, always accessed via
# .get(lang, DICT["en"]) so an unrecognized lang code degrades to English
# instead of KeyError.

RESEARCH_LINE = {
    "en": "PulseGuard AI is a research-stage screening platform — not a diagnostic device. This is a screening summary, not medical advice.",
    "ar": "بولس غارد منصة فحص في مرحلة بحثية وليست جهاز تشخيص. هذا ملخص فحص وليس نصيحة طبية.",
}

METRIC_LABELS = {
    "en": {
        "heart_rate": "Heart Rate",
        "hrv": "HRV",
        "spo2": "Oxygen Saturation",
        "systolic": "Systolic Pressure",
        "diastolic": "Diastolic Pressure",
    },
    "ar": {
        "heart_rate": "معدل ضربات القلب",
        "hrv": "تقلب معدل ضربات القلب",
        "spo2": "تشبع الأكسجين",
        "systolic": "الضغط الانقباضي",
        "diastolic": "الضغط الانبساطي",
    },
}

AREA_NAMES = {
    "en": {"rhythm": "Heart Rhythm", "oxygen": "Oxygenation", "pressure": "Blood Pressure"},
    "ar": {"rhythm": "نظم القلب", "oxygen": "الأكسجة", "pressure": "ضغط الدم"},
}

STATUS_WORD = {
    "en": {"good": "in range", "watch": "worth watching", "critical": "needs attention"},
    "ar": {"good": "ضمن المعدل", "watch": "تستحق المتابعة", "critical": "تحتاج انتباهاً"},
}


def voice(reading: dict[str, Any], risk: dict[str, Any], lang: str) -> dict[str, Any]:
    sw = STATUS_WORD.get(lang, STATUS_WORD["en"])
    labels = METRIC_LABELS.get(lang, METRIC_LABELS["en"])
    area_names = AREA_NAMES.get(lang, AREA_NAMES["en"])
    areas = risk_engine.health_areas(risk["biomarkers"])
    watch = [area_names[a] for a, s in areas.items() if s != "good"]

    if lang == "ar":
        parts = [
            f"{labels[k]} بقيمة {risk['biomarkers'][k]['value']} وهي {sw[risk['biomarkers'][k]['status']]}"
            for k in risk_engine.BIOMARKERS
        ]
        watch_txt = f"المجالات التي تستحق نظرة أقرب هي: {'، '.join(watch)}." if watch else "جميع مجالاتك الصحية تبدو مستقرة."
        script = (
            "إليك ملخص فحص بولس غارد الخاص بك. هذا ملخص في مرحلة بحثية وليس تشخيصاً طبياً. "
            f"عبر مؤشراتك الخمسة: {'، '.join(parts)}. {watch_txt} "
            "تذكّر أن بولس غارد مصمم لرصد أنماط القلب المبكرة، ولأي أمر يقلقك راجع أخصائياً طبياً."
        )
    else:
        parts = [
            f"{labels[k]} reads {risk['biomarkers'][k]['value']}, which is {sw[risk['biomarkers'][k]['status']]}"
            for k in risk_engine.BIOMARKERS
        ]
        watch_txt = f"The areas worth a closer look are: {', '.join(watch)}." if watch else "All of your health areas look steady."
        script = (
            "Here's your PulseGuard AI screening summary. This is a research-stage overview, not a medical diagnosis. "
            f"Across your five biomarkers: {', '.join(parts)}. {watch_txt} "
            "Remember, PulseGuard AI is built to catch early cardiac risk patterns — for anything concerning, check with a medical professional."
        )
    return {"script": script, "source": "fallback"}


def report(reading: dict[str, Any], risk: dict[str, Any], lang: str) -> dict[str, Any]:
    sw = STATUS_WORD.get(lang, STATUS_WORD["en"])
    area_names = AREA_NAMES.get(lang, AREA_NAMES["en"])
    areas_status = risk_engine.health_areas(risk["biomarkers"])
    areas = [
        {
            "id": aid,
            "name": area_names[aid],
            "status": status,
            "note": (
                f"{area_names[aid]}: المؤشرات {sw[status]} في هذه القراءة." if lang == "ar"
                else f"{area_names[aid]}: markers are {sw[status]} for this reading."
            ),
        }
        for aid, status in areas_status.items()
    ]
    return {
        "headline": "ملخص الفحص" if lang == "ar" else "Screening Summary",
        "overallSummary": (
            "ملخص بلغة واضحة لأحدث قراءة لعلاماتك الحيوية، عبر ثلاثة مجالات صحية." if lang == "ar"
            else "A plain-language summary of your latest vitals reading across three health areas."
        ),
        "areas": areas,
        "recommendation": (
            "حافظ على نمط حياة متوازن ونشاط منتظم، وراجع أخصائياً طبياً لأي مؤشر يبقى خارج المعدل." if lang == "ar"
            else "Keep a balanced lifestyle and regular activity, and consult a professional for any signal that stays out of range."
        ),
        "disclaimer": RESEARCH_LINE.get(lang, RESEARCH_LINE["en"]),
        "source": "fallback",
    }


def self_care(reading: dict[str, Any], risk: dict[str, Any], lang: str) -> dict[str, Any]:
    sw = STATUS_WORD.get(lang, STATUS_WORD["en"])
    area_names = AREA_NAMES.get(lang, AREA_NAMES["en"])
    areas_status = risk_engine.health_areas(risk["biomarkers"])
    rank = {"good": 0, "watch": 1, "critical": 2}
    focus = max(areas_status.items(), key=lambda kv: rank[kv[1]])
    area_tips = [
        {
            "id": aid,
            "name": area_names[aid],
            "status": status,
            "tip": (
                f"{area_names[aid]}: المؤشرات {sw[status]}. حافظ على عادات متوازنة وتابع في القراءة القادمة." if lang == "ar"
                else f"{area_names[aid]}: markers are {sw[status]}. Keep balanced habits and review at your next reading."
            ),
        }
        for aid, status in areas_status.items()
    ]
    diet = (
        {
            "breakfast": "شوفان بالماء مع فاكهة طازجة وكوب ماء.",
            "lunch": "أرز بني مع خضار مشوية وسمك أو دجاج مشوي قليل الملح.",
            "dinner": "شوربة عدس خفيفة مع سلطة خضراء.",
            "snacks": "مكسرات غير مملحة وفاكهة.",
            "hydration": "٦–٨ أكواب ماء موزعة على اليوم.",
        }
        if lang == "ar"
        else {
            "breakfast": "Oats with fresh fruit and a glass of water.",
            "lunch": "Brown rice with roasted vegetables and grilled fish or chicken, light on salt.",
            "dinner": "A light lentil soup with a green salad.",
            "snacks": "Unsalted nuts and fruit.",
            "hydration": "6–8 glasses of water spread across the day.",
        }
    )
    if lang == "ar":
        nutrition = [
            {"meal": "breakfast", "calories": 320, "protein_g": 12, "carbs_g": 52, "fat_g": 7, "micros": ["غني بالألياف", "بوتاسيوم"]},
            {"meal": "lunch", "calories": 520, "protein_g": 30, "carbs_g": 62, "fat_g": 14, "micros": ["منخفض الصوديوم", "أوميغا-3"]},
            {"meal": "dinner", "calories": 410, "protein_g": 20, "carbs_g": 55, "fat_g": 10, "micros": ["غني بالبوتاسيوم", "ألياف"]},
            {"meal": "snacks", "calories": 210, "protein_g": 7, "carbs_g": 22, "fat_g": 12, "micros": ["دهون صحية", "مغنيسيوم"]},
        ]
    else:
        nutrition = [
            {"meal": "breakfast", "calories": 320, "protein_g": 12, "carbs_g": 52, "fat_g": 7, "micros": ["High in fibre", "Potassium"]},
            {"meal": "lunch", "calories": 520, "protein_g": 30, "carbs_g": 62, "fat_g": 14, "micros": ["Lower sodium", "Omega-3"]},
            {"meal": "dinner", "calories": 410, "protein_g": 20, "carbs_g": 55, "fat_g": 10, "micros": ["Rich in potassium", "Fibre"]},
            {"meal": "snacks", "calories": 210, "protein_g": 7, "carbs_g": 22, "fat_g": 12, "micros": ["Healthy fats", "Magnesium"]},
        ]
    return {
        "focusTitle": (f"تركيز اليوم: {area_names[focus[0]]}" if lang == "ar" else f"Today's focus: {area_names[focus[0]]}"),
        "focusBody": (
            "خطة عامة للعناية الذاتية مبنية على قراءتك الأخيرة. أضف سياق طبيبك في المحادثة لتخصيصها أكثر." if lang == "ar"
            else "A general self-care plan based on your latest reading. Share your doctor's context in the chat to personalise it further."
        ),
        "dietPlan": diet,
        "areaTips": area_tips,
        "nutrition": nutrition,
        "source": "fallback",
    }


def chat(messages: list[dict[str, Any]], ctx: dict[str, Any], lang: str) -> dict[str, Any]:
    last = messages[-1]["content"] if messages else ""
    notes = " | ".join([p for p in [ctx.get("notes", ""), last] if p])
    return {
        "reply": (
            "شكراً لمشاركتك هذا. سجّلت ملاحظاتك وسأضعها في اعتباري عند تحديث خطة العناية الذاتية. (وضع بديل بدون اتصال بالذكاء الاصطناعي.)" if lang == "ar"
            else "Thanks for sharing that. I've noted it and will factor it into your self-care plan. (Offline fallback — no AI key active.)"
        ),
        "diagnosis": ctx.get("diagnosis", ""),
        "medications": ctx.get("medications", ""),
        "notes": notes,
        "contextChanged": bool(last),
        "source": "fallback",
    }
