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
