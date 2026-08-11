-- PulseGuard AI schema (Postgres). Idempotent — safe to run on every boot.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  pass_salt TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (now()::text),
  expires_at TEXT NOT NULL DEFAULT ''
);

-- Idempotent upgrade path: the sessions table pre-dates expires_at in
-- production, so CREATE TABLE IF NOT EXISTS above won't add the column to
-- an existing table. NULL/'' expires_at is treated as "already expired" by
-- the app (see app/security.py get_user_by_token), so old sessions issued
-- before this migration are safely invalidated rather than left immortal.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at TEXT;

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (now()::text)
);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON emergency_contacts(user_id);

CREATE TABLE IF NOT EXISTS vitals_readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "timestamp" TEXT NOT NULL,
  heart_rate REAL NOT NULL,
  hrv REAL NOT NULL,
  spo2 REAL NOT NULL,
  systolic REAL NOT NULL,
  diastolic REAL NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL DEFAULT (now()::text)
);
CREATE INDEX IF NOT EXISTS idx_vitals_user_time ON vitals_readings(user_id, "timestamp");

CREATE TABLE IF NOT EXISTS risk_assessments (
  id SERIAL PRIMARY KEY,
  reading_id INTEGER NOT NULL REFERENCES vitals_readings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_score REAL NOT NULL,
  risk_level TEXT NOT NULL,
  factors_json TEXT NOT NULL,
  narrative TEXT,
  source TEXT NOT NULL DEFAULT 'fallback',
  created_at TEXT NOT NULL DEFAULT (now()::text)
);
CREATE INDEX IF NOT EXISTS idx_risk_reading ON risk_assessments(reading_id);

CREATE TABLE IF NOT EXISTS alert_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_id INTEGER REFERENCES vitals_readings(id) ON DELETE SET NULL,
  risk_assessment_id INTEGER REFERENCES risk_assessments(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()::text)
);
CREATE INDEX IF NOT EXISTS idx_alerts_user_time ON alert_events(user_id, created_at);

-- One context row per user (diagnosis/medications/notes the chat agent
-- maintains) — a per-user singleton, unlike Novera's single global row,
-- since PulseGuard is multi-tenant.
CREATE TABLE IF NOT EXISTS patient_context (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL DEFAULT '',
  medications TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL DEFAULT (now()::text)
);
CREATE INDEX IF NOT EXISTS idx_chat_user_time ON chat_messages(user_id, id);
