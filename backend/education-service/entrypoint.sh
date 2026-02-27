#!/bin/bash
set -e

echo "Running Alembic migrations..."
# Try to apply migrations
if alembic upgrade head 2>&1 | grep -q "already exists"; then
    echo "Tables already exist, stamping migration as applied..."
    alembic stamp head
else
    echo "Migrations applied successfully"
fi

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
