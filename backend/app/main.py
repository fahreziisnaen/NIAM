import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.session import engine, Base
import app.db.base  # ensure all models registered
from app.db.seed import seed_database
from app.api.v1 import (
    auth,
    dashboard,
    assets,
    contracts,
    vendors,
    locations,
    topology,
    ipam,
    maintenance,
    spares,
    reports,
    documents,
    notifications,
    alerts,
    b2b_connections
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise RESTful API for Network Asset Management System (Phillip Securities Hong Kong)",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(assets.router, prefix=settings.API_V1_STR)
app.include_router(contracts.router, prefix=settings.API_V1_STR)
app.include_router(vendors.router, prefix=settings.API_V1_STR)
app.include_router(locations.router, prefix=settings.API_V1_STR)
app.include_router(topology.router, prefix=settings.API_V1_STR)
app.include_router(ipam.router, prefix=settings.API_V1_STR)
app.include_router(maintenance.router, prefix=settings.API_V1_STR)
app.include_router(spares.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(b2b_connections.router, prefix=settings.API_V1_STR)

# Static file serving for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Global Exception Handler to capture unhandled 500 errors with full trace
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_tb = traceback.format_exc()
    print(f"[FATAL BACKEND ERROR] Unhandled {type(exc).__name__} on {request.method} {request.url}:\n{err_tb}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "error_type": type(exc).__name__,
            "path": str(request.url.path),
            "message": "An internal server error occurred in the backend service. Check server container logs for traceback."
        }
    )

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "service": "Network Asset Management System API",
        "version": "1.0.0",
        "environment": "production-ready"
    }

@app.on_event("startup")
def on_startup():
    # Ensure tables exist
    print("[Startup] Ensuring database schema and tables exist...")
    Base.metadata.create_all(bind=engine)
    try:
        print("[Startup] Verifying baseline reference data...")
        seed_database()
    except Exception as e:
        print(f"[Startup Warning] Seed check encountered exception (may already be seeded): {e}")

