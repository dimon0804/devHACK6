#!/bin/bash
set -e

echo "Running Alembic migrations..."
# Check current migration version
CURRENT_VERSION=$(alembic current 2>/dev/null | awk '{print $1}' || echo "")

if [ -z "$CURRENT_VERSION" ]; then
    # No migration applied, try to apply
    echo "No migration version found, applying migrations..."
    if ! alembic upgrade head 2>&1 | tee /tmp/alembic.log; then
        # If migration failed and error is about existing tables, stamp as applied
        if grep -q "already exists" /tmp/alembic.log; then
            echo "Tables already exist, stamping migration as applied..."
            alembic stamp head
        else
            echo "Migration failed with unknown error"
            exit 1
        fi
    fi
else
    echo "Migration version $CURRENT_VERSION found, upgrading if needed..."
    alembic upgrade head
fi

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
