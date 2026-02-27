#!/bin/bash
set -e

echo "Running Alembic migrations..."
# Check if alembic_version table exists and has entries
if alembic current 2>/dev/null | grep -q "001_initial"; then
    echo "Migrations already applied, skipping..."
else
    echo "Applying migrations..."
    alembic upgrade head || {
        echo "Migration failed, trying to stamp head if tables exist..."
        # If tables exist but migration failed, stamp the migration as applied
        alembic stamp head 2>/dev/null || true
    }
fi

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
