"""Auth — scrypt password hashing + opaque bearer session tokens.
Demo-grade: sufficient for a research/demo app, not a hardened production
auth system."""
from __future__ import annotations

import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone
from hashlib import scrypt
from typing import Optional

from . import db

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_PHONE_RE = re.compile(r"^\+\d{8,15}$")

# Bearer session tokens expire after this many days. A stolen/leaked token
# is only useful for this window rather than forever.
SESSION_TTL_DAYS = 30


class AuthError(ValueError):
    pass


def _hash_password(password: str) -> tuple[str, str]:
    salt = secrets.token_hex(16)
    digest = scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64)
    return salt, digest.hex()


def _verify_password(password: str, salt: str, expected_hash: str) -> bool:
    digest = scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64)
    expected = bytes.fromhex(expected_hash)
    return hmac.compare_digest(digest, expected)


def normalize_phone(raw: Optional[str]) -> str:
    """Normalise a phone to "+<digits>" — requires an explicit country code."""
    if not raw:
        return ""
    raw = str(raw).strip()
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00"):
        digits = digits[2:]
    return "+" + digits


def _public_user(row: Optional[dict]) -> Optional[dict]:
    if not row:
        return None
    return {"id": row["id"], "email": row["email"], "name": row["name"], "phone": row["phone"]}


def create_user(name: str, email: str, password: str, phone: str) -> dict:
    norm_email = (email or "").strip().lower()
    if not _EMAIL_RE.match(norm_email):
        raise AuthError("Invalid email")
    if not password or len(password) < 6:
        raise AuthError("Password must be at least 6 characters")
    norm_phone = normalize_phone(phone)
    if not _PHONE_RE.match(norm_phone):
        raise AuthError("Invalid phone number (include country code, e.g. +1...)")

    existing = db.fetch_one("SELECT id FROM users WHERE email = ?", (norm_email,))
    if existing:
        raise AuthError("An account with this email already exists")

    salt, pass_hash = _hash_password(password)
    user_id = db.execute(
        """
        INSERT INTO users (email, name, phone, pass_salt, pass_hash)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
        """,
        (norm_email, (name or "").strip(), norm_phone, salt, pass_hash),
    )
    return _public_user(db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,)))


def authenticate(email: str, password: str) -> Optional[dict]:
    row = db.fetch_one("SELECT * FROM users WHERE email = ?", ((email or "").strip().lower(),))
    if not row or not _verify_password(password, row["pass_salt"], row["pass_hash"]):
        return None
    return _public_user(row)


def create_session(user_id: int) -> str:
    token = secrets.token_hex(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)).isoformat()
    db.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, expires_at),
    )
    return token


def get_user_by_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    row = db.fetch_one(
        """
        SELECT u.*, s.expires_at AS session_expires_at FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
        """,
        (token,),
    )
    if not row:
        return None

    now = datetime.now(timezone.utc).isoformat()
    expires_at = row["session_expires_at"]
    # NULL/'' expires_at covers sessions created before this column existed
    # (or the pre-column-add window) — treat as expired rather than immortal.
    if not expires_at or expires_at <= now:
        db.execute("DELETE FROM sessions WHERE token = ?", (token,))
        return None

    return _public_user(row)


def delete_session(token: Optional[str]) -> None:
    if token:
        db.execute("DELETE FROM sessions WHERE token = ?", (token,))
