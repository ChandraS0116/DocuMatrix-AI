import os
import warnings
import logging
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
warnings.filterwarnings("ignore", category=UserWarning, module="huggingface_hub")
warnings.filterwarnings("ignore", message=".*unauthenticated requests.*")
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.api.v1.search import search_router
from app.services.observability.control_tower import router as control_tower_router
from app.api.v1.billing import router as billing_router
from app.api.v1.chaos import router as chaos_router
from app.api.v1.cutover import router as cutover_router
from app.api.v1.public.router import public_router
from app.auth.onboarding import router as auth_router
from app.api.v1.demo import demo_seeder
from app.api.v1.upload_chunking import upload_router
from prometheus_client import make_asgi_app

app = FastAPI(
    title="Document Intelligence Foundation API",
    description="Enterprise-grade document intelligence API Phase 1",
    version="1.0.0"
)

cors_origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:3000"
]
extra_origins = os.getenv("ALLOWED_ORIGINS")
if extra_origins:
    cors_origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1", tags=["search"])
app.include_router(control_tower_router)
app.include_router(billing_router, prefix="/api/v1")
app.include_router(chaos_router, prefix="/api/v1")
app.include_router(cutover_router, prefix="/api/v1/public/cutover")
app.include_router(public_router, prefix="/api/v1/public")
app.include_router(auth_router)
app.include_router(demo_seeder.router, prefix="/api/v1/demo", tags=["demo"])
app.include_router(upload_router, prefix="/api/v1/documents/upload", tags=["upload"])

# Prometheus Metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

from app.bootstrap.system_bootstrap import SystemBootstrap

bootstrap = SystemBootstrap()
bootstrap.start()

@app.get("/health")
def health():
    services = {
        "postgres": False,
        "redis": False,
        "elasticsearch": False,
        "storage": False,
        "ml": False
    }

    # Postgres
    try:
        from app.db.session import SessionLocal
        from sqlalchemy import text
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        services["postgres"] = True
    except Exception:
        pass

    # Redis
    try:
        import redis
        import os
        r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))
        r.ping()
        services["redis"] = True
    except Exception:
        pass

    # Elasticsearch
    try:
        from app.services.search.elasticsearch_client import es_client
        if es_client.client and es_client.client.ping():
            services["elasticsearch"] = True
    except Exception:
        pass

    # Storage
    try:
        from app.services.storage.minio import minio_service
        if minio_service.enabled:
            services["storage"] = True
    except Exception:
        pass

    # ML
    try:
        import torch
        import transformers
        services["ml"] = True
    except ImportError:
        pass

    status = "ok" if all(services.values()) else "degraded"

    return {
        "status": status,
        "services": services
    }

@app.get("/health/liveness")
async def liveness():
    return {"status": "alive"}

@app.get("/health/readiness")
@app.get("/ready")
async def readiness():
    # In a real app, this would check DB, Redis, etc.
    return {"status": "ready"}
