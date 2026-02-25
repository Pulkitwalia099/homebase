"""
HomeBase AI — FastAPI backend
Run locally: uvicorn main:app --reload --port 8000
"""
import sys
import os

# Add packages/ to path so we can import from packages/db, packages/scoping, etc.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import get_settings
from routers import health, scoping, quotes, bookings, pros

settings = get_settings()

app = FastAPI(
    title="HomeBase AI API",
    version="0.1.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# ── CORS ─────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global error handler ──────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"data": None, "error": {"code": "INTERNAL_ERROR", "message": str(exc)}},
    )


# ── Routers ───────────────────────────────────
app.include_router(health.router, prefix="/v1")
app.include_router(scoping.router, prefix="/v1")   # Sprint 1
app.include_router(quotes.router, prefix="/v1")    # Sprint 2
app.include_router(bookings.router, prefix="/v1")  # Sprint 3
app.include_router(pros.router, prefix="/v1")      # Sprint 5

# Sprint 4 (Stripe) deferred — to be added after full loop is validated
# from routers import payments, webhooks
# app.include_router(payments.router, prefix="/v1")
# app.include_router(webhooks.router, prefix="/v1")


@app.get("/")
async def root():
    return {"message": "HomeBase AI API", "version": "0.1.0", "docs": "/docs"}
