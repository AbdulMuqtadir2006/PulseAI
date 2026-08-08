"""SQLite access — a single shared connection guarded by a lock.

FastAPI runs sync endpoints in a threadpool, and sqlite3.Connection isn't
safe for concurrent use across threads even with check_same_thread=False,
so every call here goes through one lock. Fine for a demo/prototype's
traffic; a real deployment serving concurrent writes at scale would want a
per-request connection (or swap to Postgres) instead.
"""
from __future__ import annotations

import sqlite3
import threading
from pathlib import Path
from typing import Any, Optional, Sequence

from . import config

BACKEND_ROOT = Path(__file__).resolve().parent.parent

_connection: Optional[sqlite3.Connection] = None
_lock = threading.Lock()


def _dict_factory(cursor: sqlite3.Cursor, row: tuple) -> dict:
    fields = [c[0] for c in cursor.description]
    return dict(zip(fields, row))


def _get_conn() -> sqlite3.Connection:
    global _connection
    if _connection is None:
        db_path = Path(config.SQLITE_PATH)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        _connection = sqlite3.connect(str(db_path), check_same_thread=False)
        _connection.row_factory = _dict_factory
        _connection.execute("PRAGMA foreign_keys = ON")
    return _connection


def fetch_one(sql: str, params: Sequence[Any] = ()) -> Optional[dict]:
    with _lock:
        return _get_conn().execute(sql, params).fetchone()


def fetch_all(sql: str, params: Sequence[Any] = ()) -> list[dict]:
    with _lock:
        return _get_conn().execute(sql, params).fetchall()


def execute(sql: str, params: Sequence[Any] = ()) -> int:
    """Runs a write statement, commits, and returns the new row's id
    (cursor.lastrowid) for INSERTs."""
    with _lock:
        conn = _get_conn()
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid


def init_schema() -> None:
    """Runs db/schema.sql (idempotent — CREATE TABLE IF NOT EXISTS throughout)."""
    ddl = (BACKEND_ROOT / "db" / "schema.sql").read_text(encoding="utf-8")
    with _lock:
        conn = _get_conn()
        conn.executescript(ddl)
        conn.commit()
