import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import Base, engine
from app.limiter import limiter
from app.routers import admin, assistant, comments, photos, qrcode, reports, stations, users

settings = get_settings()

os.makedirs(settings.upload_dir, exist_ok=True)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # MVP: tables are created at startup rather than via a migration tool.
    # db/init/*.sql (mounted into postgres) covers a fresh install; this call
    # is a no-op safety net when the schema already exists. Deferred to
    # startup (rather than import time) so importing this module for tests
    # doesn't require a live database connection.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description="Recharge smarter. Drive calmer.",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

prefix = settings.api_v1_prefix
app.include_router(stations.router, prefix=prefix)
app.include_router(reports.router, prefix=prefix)
app.include_router(comments.router, prefix=prefix)
app.include_router(photos.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)
app.include_router(assistant.router, prefix=prefix)
app.include_router(qrcode.router, prefix=prefix)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}
