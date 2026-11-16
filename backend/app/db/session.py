import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

database_url = settings.DATABASE_URL

# Normalize sqlite URL if relative
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

is_postgres = "postgres" in database_url.lower()

if is_postgres:
    # Persistent PostgreSQL Connection with retry loop
    # NEVER silently fallback to ephemeral SQLite in containers to prevent data loss on rebuild!
    max_retries = 15
    connected = False
    last_err = None
    engine = None

    for attempt in range(1, max_retries + 1):
        try:
            temp_engine = create_engine(
                database_url,
                connect_args=connect_args,
                pool_pre_ping=True
            )
            with temp_engine.connect() as conn:
                pass
            engine = temp_engine
            connected = True
            print(f"[DB] Successfully connected to persistent PostgreSQL database (attempt {attempt}).")
            break
        except Exception as e:
            last_err = e
            print(f"[DB Warning] Attempt {attempt}/{max_retries}: PostgreSQL not ready yet ({e}). Retrying in 1s...")
            time.sleep(1)

    if not connected:
        err_msg = (
            f"[FATAL DB ERROR] Could not connect to PostgreSQL database after {max_retries} attempts: {last_err}.\n"
            f"Database URL: {database_url}\n"
            "FastAPI backend will NOT fall back to ephemeral SQLite to prevent catastrophic data loss during container rebuilds."
        )
        print(err_msg)
        if os.getenv("ALLOW_SQLITE_FALLBACK", "false").lower() in ("true", "1", "yes"):
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            sqlite_path = os.path.join(backend_dir, "phillip_assets.db")
            print(f"[DB Warning] ALLOW_SQLITE_FALLBACK is true. Falling back to SQLite at {sqlite_path}.")
            sqlite_url = f"sqlite:///{sqlite_path.replace(chr(92), '/')}"
            engine = create_engine(
                sqlite_url,
                connect_args={"check_same_thread": False},
                pool_pre_ping=True
            )
        else:
            raise RuntimeError(err_msg)
else:
    # Local host development SQLite mode
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    print(f"[DB] Initialized local SQLite database engine at {database_url}.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


