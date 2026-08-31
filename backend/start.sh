#!/bin/bash
set -e

echo "=== Initializing schema & seeding database... ==="
PYTHONPATH=. python scripts/seed.py || echo "⚠️ Seeding step completed with warning"

echo "=== Running database migrations... ==="
alembic upgrade head || echo "⚠️ Migration step completed with warning"

echo "=== Starting FastAPI server... ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8001
