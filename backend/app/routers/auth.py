from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from .. import security
from ..deps import get_token, require_user
from ..schemas import LoginReq, SignupReq

router = APIRouter()

# Per-IP, in-memory rate limiter for the unauthenticated auth endpoints
# (signup/login), which have no bearer-token protection and are
# otherwise open to credential-stuffing / signup spam. Attached to
# app.state.limiter in app/main.py.
limiter = Limiter(key_func=get_remote_address)


@router.post("/signup", status_code=201)
@limiter.limit("5/minute")
def signup(request: Request, body: SignupReq):
    try:
        user = security.create_user(body.name, body.email, body.password, body.phone)
    except security.AuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    token = security.create_session(user["id"])
    return {"token": token, "user": user}


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginReq):
    user = security.authenticate(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = security.create_session(user["id"])
    return {"token": token, "user": user}


@router.get("/me")
def me(user: dict = Depends(require_user)):
    return {"user": user}


@router.post("/logout")
def logout(token: str = Depends(get_token)):
    security.delete_session(token)
    return {"ok": True}
