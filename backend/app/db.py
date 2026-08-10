"""Postgres access — a single shared connection guarded by a lock.

FastAPI runs sync endpoints in a threadpool, and one psycopg2 connection
isn't safe for concurrent use across threads, so every call here goes
through one lock. Fine for a demo/prototype's traffic; a real deployment
serving concurrent writes at scale would want a connection pool instead.

Call sites still write SQLite-style `?` placeholders — _to_pg() translates
them to psycopg2's `%s` so the router/service code didn't need to change.
"""
from __future__ import annotations

import re
import threading
from pathlib import Path
from typing import Any, Optional, Sequence

import psycopg2
import psycopg2.extras

from . import config

BACKEND_ROOT = Path(__file__).resolve().parent.parent

_connection: Optional["psycopg2.extensions.connection"] = None
_lock = threading.Lock()

_QMARK_RE = re.compile(r"\?")


def _to_pg(sql: str) -> str:
    return _QMARK_RE.sub("%s", sql)


def _get_conn() -> "psycopg2.extensions.connection":
    global _connection
    if _connection is None:
        _connection = psycopg2.connect(config.DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    return _connection


def fetch_one(sql: str, params: Sequence[Any] = ()) -> Optional[dict]:
    with _lock:
        conn = _get_conn()
        with conn.cursor() as cur:
            cur.execute(_to_pg(sql), params)
            row = cur.fetchone()
            conn.commit()
            return dict(row) if row is not None else None


def fetch_all(sql: str, params: Sequence[Any] = ()) -> list[dict]:
    with _lock:
        conn = _get_conn()
        with conn.cursor() as cur:
            cur.execute(_to_pg(sql), params)
            rows = cur.fetchall()
            conn.commit()
            return [dict(r) for r in rows]


def execute(sql: str, params: Sequence[Any] = ()) -> Optional[int]:
    """Runs a write statement and commits. If the statement has a RETURNING
    clause (used on INSERTs where the caller needs the new row's id),
    returns that row's "id" column; otherwise returns None."""
    pg_sql = _to_pg(sql)
    with _lock:
        conn = _get_conn()
        with conn.cursor() as cur:
            cur.execute(pg_sql, params)
            new_id = None
            if "returning" in pg_sql.lower():
                row = cur.fetchone()
                new_id = row["id"] if row else None
            conn.commit()
            return new_id


def init_schema() -> None:
    """Runs db/schema.sql (idempotent — CREATE TABLE IF NOT EXISTS throughout)."""
    ddl = (BACKEND_ROOT / "db" / "schema.sql").read_text(encoding="utf-8")
    with _lock:
        conn = _get_conn()
        with conn.cursor() as cur:
            cur.execute(ddl)
        conn.commit()
