"""Central configuration for the PulseGuard AI backend. Everything comes
from the environment — nothing here is ever a real secret."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BACKEND_ROOT = Path(__file__).resolve().parent.parent

# ---- database (Postgres — see db.py) ----
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# ---- OpenRouter — one model for the risk narrative ----
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3.1").strip()
OPENROUTER_TIMEOUT_SECONDS = max(15, int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "60")))
AI_ENABLED = bool(OPENROUTER_API_KEY.startswith("sk-or-"))

# ---- emergency notification provider ----
# Unset by default on purpose (see .env.example) — alerts run in simulated
# mode until a real provider is deliberately configured.
EMERGENCY_WEBHOOK_URL = os.getenv("EMERGENCY_WEBHOOK_URL", "").strip()
EMERGENCY_NOTIFY_ENABLED = bool(EMERGENCY_WEBHOOK_URL)

# ---- CORS ----
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

# ---- misc ----
SERVICE_PORT = int(os.getenv("PORT", "8000"))
