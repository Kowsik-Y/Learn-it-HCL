#!/bin/bash
set -e

echo "=== Running database migrations... ==="
alembic upgrade head

echo "=== Seeding database... ==="
python scripts/seed.py || echo "Seeding skipped (data may already exist)"

echo "=== Starting FastAPI server... ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8001
