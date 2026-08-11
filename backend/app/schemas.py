"""Pydantic request bodies + agent-output models."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

# ---- auth ----
class SignupReq(BaseModel):
    name: str = ""
    email: str
    password: str
    phone: str = ""


class LoginReq(BaseModel):
    email: str
    password: str


# ---- vitals ----
Scenario = Literal["normal", "elevated", "critical"]


class SimulateReq(BaseModel):
    scenario: Scenario = "normal"


# ---- emergency contacts ----
class ContactIn(BaseModel):
    name: str
    phone: str
    relationship: str = ""


# ---- insight (risk narrative) agent output ----
class RiskNarrativeOut(BaseModel):
    narrative: str = Field(min_length=20, max_length=900)
    recommendation: str = Field(min_length=10, max_length=400)


# ---- content agents: voice / report / self-care / chat ----
Lang = Literal["en", "ar"]


class LangReq(BaseModel):
    lang: Lang = "en"


class VoiceAudioReq(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    lang: Lang = "en"


class ChatSendReq(BaseModel):
    message: str
    lang: Lang = "en"


class VoiceOut(BaseModel):
    script: str = Field(min_length=10)


class ReportArea(BaseModel):
    id: str
    name: str
    status: str
    note: str


class ReportOut(BaseModel):
    headline: str
    overallSummary: str
    areas: list[ReportArea]
    recommendation: str


class DietPlan(BaseModel):
    breakfast: str
    lunch: str
    dinner: str
    snacks: str
    hydration: str


class AreaTip(BaseModel):
    id: str
    name: str
    status: str
    tip: str


class MealNutrition(BaseModel):
    meal: str
    calories: int = Field(ge=0, le=3000)
    protein_g: int = Field(ge=0, le=300)
    carbs_g: int = Field(ge=0, le=500)
    fat_g: int = Field(ge=0, le=300)
    micros: list[str] = []


class SelfCareOut(BaseModel):
    focusTitle: str
    focusBody: str
    dietPlan: DietPlan
    areaTips: list[AreaTip]
    nutrition: list[MealNutrition] = []


class ChatOut(BaseModel):
    reply: str
    diagnosis: str = ""
    medications: str = ""
    notes: str = ""
    contextChanged: bool = False
