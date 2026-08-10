from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from .. import db, security
from ..deps import require_user
from ..schemas import ContactIn

router = APIRouter()


@router.get("/contacts")
def list_contacts(user: dict = Depends(require_user)):
    return db.fetch_all(
        "SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY id ASC",
        (user["id"],),
    )


@router.post("/contacts", status_code=201)
def add_contact(body: ContactIn, user: dict = Depends(require_user)):
    phone = security.normalize_phone(body.phone)
    if not phone or len(phone) < 8:
        raise HTTPException(status_code=400, detail="Invalid phone number (include country code, e.g. +1...)")
    contact_id = db.execute(
        "INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES (?, ?, ?, ?) RETURNING id",
        (user["id"], body.name.strip(), phone, body.relationship.strip()),
    )
    return db.fetch_one("SELECT * FROM emergency_contacts WHERE id = ?", (contact_id,))


@router.delete("/contacts/{contact_id}", status_code=204)
def delete_contact(contact_id: int, user: dict = Depends(require_user)):
    db.execute(
        "DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?",
        (contact_id, user["id"]),
    )
    return None
