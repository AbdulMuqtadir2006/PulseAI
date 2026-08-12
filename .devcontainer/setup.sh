#!/usr/bin/env bash
# Runs once when the Codespace/devcontainer is created.
set -e

cd "$(dirname "$0")/.."

echo "==> Installing backend dependencies..."
pip install --user -r backend/requirements.txt

echo "==> Installing frontend dependencies..."
(cd frontend && npm install)

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  # .env.example points DATABASE_URL at localhost; in this devcontainer
  # Postgres runs as its own compose service reachable at host "db".
  sed -i 's|@localhost:5432|@db:5432|' backend/.env
  echo "==> Created backend/.env (DATABASE_URL -> db:5432)"
fi

if [ ! -f frontend/.env ]; then
  echo "# Left unset on purpose — Vite's dev proxy forwards /api to :8000 (see vite.config.js)" > frontend/.env
  echo "==> Created frontend/.env"
fi

echo "==> Setup complete. Start both dev servers with: bash .devcontainer/dev.sh"
