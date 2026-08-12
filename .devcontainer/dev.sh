#!/usr/bin/env bash
# Runs both dev servers at once (backend in the background, frontend in the
# foreground). Ctrl+C stops both.
set -e
cd "$(dirname "$0")/.."

cleanup() {
  echo ""
  echo "==> Stopping backend..."
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Starting backend (http://localhost:8000)..."
(cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

echo "==> Starting frontend (http://localhost:5173)..."
(cd frontend && npm run dev -- --host 0.0.0.0)
