#!/bin/sh
set -e

echo "=== Phillip Securities HK Network Asset Management ==="

# Wait for database if PostgreSQL is used
if echo "$DATABASE_URL" | grep -q "postgres"; then
    echo "[Entrypoint] Waiting for PostgreSQL database connection..."
    python - <<'END'
import time
import os
import sys
from urllib.parse import urlparse
import psycopg2

db_url = os.environ.get("DATABASE_URL", "")
parsed = urlparse(db_url)
user = parsed.username or "postgres"
password = parsed.password or "PhillipPostgres2026!"
host = parsed.hostname or "db"
port = parsed.port or 5432
dbname = parsed.path.lstrip("/") or "phillip_assets"

max_retries = 30
for i in range(max_retries):
    try:
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port,
            connect_timeout=3
        )
        conn.close()
        print(f"[Entrypoint] PostgreSQL is online and ready at {host}:{port}/{dbname}!")
        sys.exit(0)
    except Exception as e:
        print(f"[Entrypoint] Attempt {i+1}/{max_retries}: PostgreSQL not ready yet ({e}). Retrying in 1s...")
        time.sleep(1)

print("[Entrypoint] ERROR: Could not connect to PostgreSQL within 30 seconds.")
sys.exit(1)
END
fi

# Ensure tables and baseline data exist
echo "[Entrypoint] Running database table creation and baseline seed..."
python -m app.db.seed

echo "[Entrypoint] Starting FastAPI backend on http://0.0.0.0:8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
