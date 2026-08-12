# PulseGuard AI

A research-stage prototype exploring what continuous cardiac monitoring could do: a wearable-AI
concept that watches heart rate, HRV, SpO2, and blood pressure, scores risk against reference
ranges, explains it in plain language, and escalates to an emergency contact when a reading is
critical. **Not a medical device — has not been clinically validated.**

Sibling project to `D:\Novera`, same architectural pattern, different domain (cardiac risk instead
of saliva biosensor screening) and its own brand identity.

## Stack

- `frontend/` — React 18 + Vite + Tailwind, Three.js/`@react-three/fiber` for the 3D hero (live EKG
  waveform + pulsing heart), the site-wide ambient particle field, and the pipeline visualization;
  Framer Motion for UI animation, Recharts for trend charts.
- `backend/` — FastAPI + SQLite (`backend/app/db.py`; no external DB setup needed). Auth (scrypt +
  bearer session tokens), a deterministic reference-range risk-scoring engine
  (`core/risk_engine.py`), one OpenRouter call for the plain-language narrative
  (`core/insight_llm.py`, with a deterministic fallback if no API key is set), and an
  emergency-notify module that's **simulated by default** — logs + records an `AlertEvent`, sends
  nothing real, until `EMERGENCY_WEBHOOK_URL` is deliberately configured.

## Run locally

```
# backend
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
cp .env.example .env
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000

# frontend (separate terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173, proxies /api to :8000
```

There's no real wearable behind this — the dashboard's "Normal / Elevated / Simulate emergency"
buttons generate plausible readings (`backend/app/core/demo_data.py`) to drive the same real
scoring/narrative/alert pipeline a genuine device would.

## Codespaces (cloud dev environment, no local disk usage)

This repo has a `.devcontainer/` config: open it in a GitHub Codespace and everything — Node,
Python, and a Postgres instance — spins up in the cloud, nothing installed on your machine.

1. On GitHub: **Code → Codespaces → Create codespace on main**.
2. First boot runs `.devcontainer/setup.sh` automatically (installs both `frontend/` and
   `backend/` dependencies, creates `.env` files pointed at the devcontainer's own Postgres).
3. Once it's ready, open a terminal and run `bash .devcontainer/dev.sh` — starts both the backend
   (`:8000`) and frontend (`:5173`) dev servers together; Codespaces forwards both ports
   automatically and opens a preview of the frontend.

## Deploying

Not deployed yet — no hosting/domain/CI set up. Frontend is a static Vite build (deployable
anywhere static, e.g. Cloudflare Pages/Workers); backend is a standard FastAPI app (deployable
anywhere Python runs, e.g. Railway). `backend/db.py` speaks SQLite directly, not an ORM — swapping
to Postgres for a real deployment means rewriting that one file, not just changing a connection
string.
