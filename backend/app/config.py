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
# Note: the list-comp above already guards against stray empty strings (e.g. a
# trailing comma or "http://a,,http://b") via `if origin.strip()`, so those can't
# slip through as an accidental "" entry.

# Defense in depth: main.py wires CORS_ORIGINS into Starlette's CORSMiddleware
# with allow_credentials=True. Per the CORS spec, browsers actually reject
# "Access-Control-Allow-Origin: *" when credentials are involved — but that's a
# browser-side backstop, not something we should rely on. Some middleware
# versions/configs respond to allow_origins=["*"] + allow_credentials=True by
# reflecting the literal request Origin header back on every request, which is
# equivalent to allowing any origin with credentials — a silent, hard-to-notice
# hole if someone sets CORS_ORIGINS="*" in the Railway dashboard as a "just
# allow everything" shortcut. Since this is about to run in production and a
# broken CORS policy won't show up as an obvious error (requests just quietly
# succeed cross-origin), we hard-fail at startup rather than strip-and-warn:
# a crashed deploy gets noticed immediately, a swallowed log line does not.
if "*" in CORS_ORIGINS:
    raise RuntimeError(
        "CORS_ORIGINS must not contain '*' when allow_credentials=True is used "
        "(see main.py's CORSMiddleware setup) — a wildcard origin combined with "
        "credentials is a well-known CORS footgun that can effectively disable "
        "origin checking. Set CORS_ORIGINS to an explicit comma-separated list "
        "of allowed origins instead, e.g. "
        "'https://app.example.com,https://admin.example.com'."
    )

# ---- misc ----
SERVICE_PORT = int(os.getenv("PORT", "8000"))
