"""PulseGuard AI backend — FastAPI entry point (app.main:app)."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, db
from .routers import alerts, auth, contacts, health, vitals

app = FastAPI(title="PulseGuard AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    db.init_schema()


app.include_router(health.router)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(vitals.router, prefix="/api", tags=["vitals"])
app.include_router(contacts.router, prefix="/api", tags=["contacts"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=config.SERVICE_PORT)
