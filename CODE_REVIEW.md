# HomeBase AI — Full Code Review Package

> Generated: 2026-02-24 | Phase 1 Complete (Sprints 0–5)
> Share this file with Claude (or any reviewer) for a full code review.
> **No secrets are included in this file.**

---

## What Was Built

HomeBase AI is a "Stripe for home services" — customers describe a plumbing problem in chat, Claude AI diagnoses it and gives a guaranteed fixed price, the customer books, a pro gets an SMS, accepts, and the customer is confirmed.

**Full loop:** Chat → AI Scope → Quote → Booking Form → Job in DB → Pro SMS → Pro Job Card → Accept → Customer Confirmation SMS

---

## Architecture

```
homebase/
├── apps/web/                        # Next.js 16 frontend (TypeScript + Tailwind)
│   ├── app/
│   │   ├── chat/page.tsx            # Customer chat UI
│   │   ├── quote/[sessionId]/       # Quote + booking form
│   │   ├── booking/[jobId]/         # Booking confirmation (Stripe deferred)
│   │   └── pro/jobs/[jobId]/        # Pro job card (accept/decline)
│   ├── components/
│   │   ├── chat/                    # ChatWindow, MessageBubble, QuoteBubble, etc.
│   │   ├── quote/                   # QuoteCard, BookingForm
│   │   └── ui/                      # Button, Card, Badge, LoadingSpinner
│   ├── hooks/useChat.ts             # Chat state + localStorage + API calls
│   └── lib/
│       ├── api-client.ts            # Typed fetch wrappers for all endpoints
│       └── types.ts                 # All shared TypeScript types
│
├── packages/
│   ├── api/                         # FastAPI backend (Python 3.12, async)
│   │   ├── main.py                  # App entry point, CORS, routers
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic settings (reads from .env)
│   │   │   └── database.py          # Async SQLAlchemy engine + session
│   │   └── routers/
│   │       ├── health.py            # GET /v1/health
│   │       ├── scoping.py           # POST /v1/scoping/start|message
│   │       ├── quotes.py            # GET /v1/quotes/{session_id}
│   │       ├── bookings.py          # POST /v1/bookings
│   │       └── pros.py              # GET/POST /v1/pros/jobs/{id}
│   │
│   ├── db/
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── base.py              # Enums + TimestampMixin
│   │   │   ├── customer.py          # Customer + Address + HomeProfile
│   │   │   ├── job.py               # Job + ScopeChange + JobStatusEvent
│   │   │   ├── pro.py               # Pro + ProAvailability
│   │   │   ├── pricing.py           # JobCode + PriceAdjustment
│   │   │   └── scoping.py           # ScopingSession
│   │   ├── migrations/              # Alembic (1 migration = full schema)
│   │   └── seed.py                  # 15 job codes + price adjustments + 1 test pro
│   │
│   ├── scoping/                     # AI scoping engine
│   │   ├── engine.py                # ScopingEngine (Claude orchestration)
│   │   ├── classifier.py            # JSON parser for Claude's classification output
│   │   └── pricer.py                # Price calculation with multipliers + flat adds
│   │
│   └── sms/
│       ├── client.py                # Twilio wrapper (console fallback in dev)
│       └── templates.py             # pro_job_offer + customer_job_confirmed messages
│
└── prompts/scoping/system.md        # Claude's system prompt (job codes, rules, format)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (TypeScript + Tailwind CSS) |
| Backend | FastAPI (Python 3.12, async) |
| Database | PostgreSQL on Supabase (asyncpg + SQLAlchemy 2.0) |
| AI | Anthropic claude-sonnet-4-6 |
| SMS | Twilio (console fallback in dev — toll-free number pending verification) |
| Payments | Stripe (Sprint 4 — deferred) |
| Deploy | Not yet deployed (Railway + Vercel planned) |

---

## Sprint Status

| Sprint | Goal | Status |
|--------|------|--------|
| Sprint 0 | Foundation: repo, DB, models, seed | ✅ Done |
| Sprint 1 | AI Scoping Engine | ✅ Done |
| Sprint 2 | Customer Chat UI | ✅ Done |
| Sprint 3 | Quote + Booking Screen | ✅ Done |
| Sprint 4 | Stripe Payments | ⏸ Deferred |
| Sprint 5 | Pro SMS + Job Card | ✅ Done |

---

## Known Issues / Things to Review

1. **Global exception handler leaks stack traces** — `str(exc)` returned to client in production
2. **No rate limiting** — scoping endpoints can be called unlimited times (API cost exposure)
3. **Customer phone stored without E.164 format** — booking form sends raw digits, no `+1` prefix
4. **SMS error not handled gracefully** — if Twilio throws, the exception propagates after job is already committed to DB (job created but SMS not sent, returns 500)
5. **CORS allows localhost in production** — `http://localhost:3000` hardcoded in main.py
6. **No auth on pro job card** — token-only, no account system for pros
7. **Single pro for all jobs** — always picks first active pro, no matching algorithm
8. **`booking/[jobId]/page.tsx` doesn't use React.use(params)** — still uses old Next.js 14 style params (not yet updated like the pro job card page was)
9. **No input validation on booking form** — email format, phone format, zip code not validated
10. **Session ID stored in localStorage** — if backend DB is reset, user gets a stale session ID causing a 404 error on next message

---

## Source Files

---

### `packages/api/main.py`

```python
"""
HomeBase AI — FastAPI backend
Run locally: uvicorn main:app --reload --port 8000
"""
import sys
import os

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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"data": None, "error": {"code": "INTERNAL_ERROR", "message": str(exc)}},
    )

app.include_router(health.router, prefix="/v1")
app.include_router(scoping.router, prefix="/v1")
app.include_router(quotes.router, prefix="/v1")
app.include_router(bookings.router, prefix="/v1")
app.include_router(pros.router, prefix="/v1")

@app.get("/")
async def root():
    return {"message": "HomeBase AI API", "version": "0.1.0", "docs": "/docs"}
```

---

### `packages/api/core/config.py`

```python
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    DATABASE_URL: str = ""
    ANTHROPIC_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = "placeholder"
    TWILIO_AUTH_TOKEN: str = "placeholder"
    TWILIO_FROM_NUMBER: str = "+10000000000"
    STRIPE_SECRET_KEY: str = "sk_test_placeholder"
    STRIPE_WEBHOOK_SECRET: str = "whsec_placeholder"
    STRIPE_BOOKING_FEE_CENTS: int = 3500
    SECRET_KEY: str = "changeme"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    INTERNAL_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "job-photos"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def twilio_configured(self) -> bool:
        return (
            self.TWILIO_ACCOUNT_SID != "placeholder"
            and self.TWILIO_AUTH_TOKEN != "placeholder"
        )

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

---

### `packages/api/core/database.py`

```python
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from .config import get_settings

settings = get_settings()

def _build_engine_args(url: str) -> tuple[str, dict]:
    """Strip ssl/sslmode query params — asyncpg needs them via connect_args instead."""
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    needs_ssl = any(k in qs for k in ("ssl", "sslmode"))
    for key in ("ssl", "sslmode"):
        qs.pop(key, None)
    clean_url = urlunparse(parsed._replace(query=urlencode(qs, doseq=True)))
    connect_args = {"ssl": "require"} if needs_ssl else {}
    return clean_url, connect_args

_db_url, _connect_args = _build_engine_args(settings.DATABASE_URL)

engine = create_async_engine(
    _db_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=settings.ENVIRONMENT == "development",
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

---

### `packages/api/routers/health.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {"status": "ok", "db": db_status}
```

---

### `packages/api/routers/scoping.py`

```python
"""
POST /v1/scoping/start   — Start a new scoping conversation
POST /v1/scoping/message — Send next message in existing conversation
GET  /v1/scoping/{session_id} — Retrieve full session state
"""
from __future__ import annotations
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import get_settings
from core.database import get_db
from db.models.scoping import ScopingSession
from scoping.engine import ScopingEngine
from scoping.pricer import calculate_quote

router = APIRouter(tags=["scoping"])

class StartRequest(BaseModel):
    initial_message: str
    channel: str = "web"

class MessageRequest(BaseModel):
    session_id: str
    message: str

class ScopingResponse(BaseModel):
    session_id: str
    message: str
    is_classified: bool
    quote: Optional[dict] = None

def _make_engine(db):
    settings = get_settings()
    return ScopingEngine(db=db, anthropic_api_key=settings.ANTHROPIC_API_KEY)

async def _build_quote_if_classified(session, db):
    if session.classified_job_code_id is None:
        return None
    quote = await calculate_quote(db=db, job_code_id=session.classified_job_code_id,
        adjustment_flags=session.adjustment_flags or {})
    quote["confidence"] = session.confidence_score
    quote["confidence_tier"] = session.confidence_tier.value if session.confidence_tier else None
    return quote

@router.post("/scoping/start", response_model=ScopingResponse)
async def start_scoping(body: StartRequest, db: AsyncSession = Depends(get_db)):
    engine = _make_engine(db)
    session, reply = await engine.start_session(initial_message=body.initial_message, channel=body.channel)
    is_classified = session.classified_job_code_id is not None
    quote = await _build_quote_if_classified(session, db) if is_classified else None
    return ScopingResponse(session_id=str(session.id), message=reply,
        is_classified=is_classified, quote=quote)

@router.post("/scoping/message", response_model=ScopingResponse)
async def send_message(body: MessageRequest, db: AsyncSession = Depends(get_db)):
    try:
        session_id = uuid.UUID(body.session_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="session_id must be a valid UUID")
    engine = _make_engine(db)
    try:
        session, reply, _ = await engine.continue_session(session_id=session_id, user_message=body.message)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    is_classified = session.classified_job_code_id is not None
    quote = await _build_quote_if_classified(session, db) if is_classified else None
    return ScopingResponse(session_id=str(session.id), message=reply,
        is_classified=is_classified, quote=quote)

@router.get("/scoping/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="session_id must be a valid UUID")
    result = await db.execute(select(ScopingSession).where(ScopingSession.id == sid))
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return {
        "session_id": str(session.id),
        "status": session.status.value,
        "classified_job_code_id": str(session.classified_job_code_id) if session.classified_job_code_id else None,
        "confidence_score": session.confidence_score,
        "confidence_tier": session.confidence_tier.value if session.confidence_tier else None,
        "adjustment_flags": session.adjustment_flags,
        "turn_count": len(session.conversation_history) // 2 if session.conversation_history else 0,
    }
```

---

### `packages/api/routers/quotes.py`

```python
"""GET /v1/quotes/{session_id}"""
from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from db.models.scoping import ScopingSession
from db.models.pricing import JobCode
from scoping.pricer import calculate_quote

router = APIRouter(tags=["quotes"])

class JobCodeSummary(BaseModel):
    code: str; name: str; description: str
    estimated_duration_min: int; parts_included: bool; category: str

class PriceBreakdownItem(BaseModel):
    label: str; amount_cents: int

class AdjustmentFlags(BaseModel):
    old_home: bool; accessibility: bool; after_hours: bool; weekend: bool

class QuoteResponse(BaseModel):
    session_id: str
    job_code: JobCodeSummary
    quoted_price_cents: int
    price_breakdown: list[PriceBreakdownItem]
    whats_included: list[str]
    confidence_tier: str
    adjustment_flags: AdjustmentFlags

@router.get("/quotes/{session_id}", response_model=QuoteResponse)
async def get_quote(session_id: str, db: AsyncSession = Depends(get_db)):
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="session_id must be a valid UUID")
    result = await db.execute(select(ScopingSession).where(ScopingSession.id == sid))
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    if session.classified_job_code_id is None:
        raise HTTPException(status_code=404, detail="Session not classified yet")
    jc_result = await db.execute(select(JobCode).where(JobCode.id == session.classified_job_code_id))
    job_code_row = jc_result.scalar_one()
    flags = session.adjustment_flags or {}
    quote = await calculate_quote(db=db, job_code_id=session.classified_job_code_id, adjustment_flags=flags)
    return QuoteResponse(
        session_id=str(session.id),
        job_code=JobCodeSummary(code=job_code_row.code, name=job_code_row.name,
            description=job_code_row.description, estimated_duration_min=job_code_row.estimated_duration_min,
            parts_included=job_code_row.parts_included, category=job_code_row.category),
        quoted_price_cents=quote["final_price_cents"],
        price_breakdown=[PriceBreakdownItem(label=i["label"], amount_cents=i["amount_cents"])
            for i in quote["price_breakdown"]],
        whats_included=[],
        confidence_tier=session.confidence_tier.value if session.confidence_tier else "tier1",
        adjustment_flags=AdjustmentFlags(old_home=bool(flags.get("old_home")),
            accessibility=bool(flags.get("accessibility")), after_hours=bool(flags.get("after_hours")),
            weekend=bool(flags.get("weekend"))),
    )
```

---

### `packages/api/routers/bookings.py`

```python
"""POST /v1/bookings — Create booking from classified scoping session"""
from __future__ import annotations
import secrets, uuid
from datetime import date, time
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import get_settings
from core.database import get_db
from db.models.base import JobStatusEnum, ProStatusEnum
from db.models.customer import Address, Customer
from db.models.job import Job
from db.models.pricing import JobCode
from db.models.pro import Pro
from db.models.scoping import ScopingSession
from scoping.pricer import calculate_quote
from sms.client import send_sms
from sms.templates import pro_job_offer

settings = get_settings()
router = APIRouter(tags=["bookings"])

class CustomerCreate(BaseModel):
    name: str; email: str; phone: str

class AddressCreate(BaseModel):
    street: str; city: str; state: str; zip: str
    property_year_built: Optional[int] = None
    accessibility_issues: bool = False

class BookingRequest(BaseModel):
    session_id: uuid.UUID
    customer: CustomerCreate
    address: AddressCreate
    scheduled_window: Literal["morning", "afternoon", "emergency"]
    scheduled_date: date

class BookingResponse(BaseModel):
    job_id: str; customer_id: str
    client_secret: str       # empty — Stripe added in Sprint 4
    stripe_customer_id: str  # empty — Stripe added in Sprint 4
    quoted_price_cents: int

_WINDOW_TIMES = {
    "morning":   (time(8, 0),  time(12, 0)),
    "afternoon": (time(12, 0), time(17, 0)),
    "emergency": (time(0, 0),  time(23, 59)),
}
EMERGENCY_SURCHARGE_CENTS = 7_500  # +$75

@router.post("/bookings", response_model=BookingResponse, status_code=201)
async def create_booking(body: BookingRequest, db: AsyncSession = Depends(get_db)):
    # 1. Validate scoping session
    result = await db.execute(select(ScopingSession).where(ScopingSession.id == body.session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail=f"Scoping session {body.session_id} not found.")
    if session.classified_job_code_id is None:
        raise HTTPException(status_code=422, detail="Session not classified yet.")

    # 2. Recalculate price server-side
    flags = session.adjustment_flags or {}
    quote = await calculate_quote(db=db, job_code_id=session.classified_job_code_id, adjustment_flags=flags)
    quoted_price_cents = quote["final_price_cents"]
    if body.scheduled_window == "emergency":
        quoted_price_cents += EMERGENCY_SURCHARGE_CENTS

    # 3. Find or create customer
    cust_result = await db.execute(select(Customer).where(Customer.email == body.customer.email))
    customer = cust_result.scalar_one_or_none()
    if customer is None:
        customer = Customer(name=body.customer.name, email=body.customer.email, phone=body.customer.phone)
        db.add(customer)
        await db.flush()
    else:
        customer.name = body.customer.name
        customer.phone = body.customer.phone

    # 4. Create address
    address = Address(customer_id=customer.id, street=body.address.street, city=body.address.city,
        state=body.address.state, zip=body.address.zip, property_year_built=body.address.property_year_built)
    db.add(address)
    await db.flush()

    # 5. Find pro + generate token
    window_start, window_end = _WINDOW_TIMES[body.scheduled_window]
    pro_result = await db.execute(select(Pro).where(Pro.status == ProStatusEnum.active).limit(1))
    pro = pro_result.scalar_one_or_none()
    accept_token = secrets.token_urlsafe(32) if pro else None

    jc_result = await db.execute(select(JobCode).where(JobCode.id == session.classified_job_code_id))
    job_code_row = jc_result.scalar_one()

    # 6. Create job
    job = Job(customer_id=customer.id, address_id=address.id, scoping_session_id=session.id,
        job_code_id=session.classified_job_code_id, quoted_price_cents=quoted_price_cents,
        scheduled_date=body.scheduled_date, scheduled_window_start=window_start,
        scheduled_window_end=window_end, status=JobStatusEnum.pending_pro_accept,
        pro_accept_token=accept_token)
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # 7. Send SMS to pro
    if pro and accept_token:
        accept_url = f"{settings.FRONTEND_URL}/pro/jobs/{job.id}?token={accept_token}"
        send_sms(to=pro.phone, body=pro_job_offer(service_name=job_code_row.name,
            city=body.address.city, price_dollars=quoted_price_cents // 100, accept_url=accept_url),
            settings=settings)

    return BookingResponse(job_id=str(job.id), customer_id=str(customer.id),
        client_secret="", stripe_customer_id="", quoted_price_cents=quoted_price_cents)
```

---

### `packages/api/routers/pros.py`

```python
"""
GET  /v1/pros/jobs/{job_id}?token= — Pro job card
POST /v1/pros/jobs/{job_id}/accept — Pro accepts job
"""
from __future__ import annotations
import hmac, uuid
from datetime import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from core.config import get_settings
from core.database import get_db
from db.models.base import JobStatusEnum, ProStatusEnum
from db.models.job import Job
from db.models.pro import Pro
from sms.client import send_sms
from sms.templates import customer_job_confirmed

router = APIRouter(tags=["pros"])
settings = get_settings()

def _format_window(start, end):
    if start is None or end is None: return "TBD"
    if start == time(0, 0) and end == time(23, 59): return "ASAP (Emergency)"
    def _fmt(t):
        h = t.hour; suffix = "am" if h < 12 else "pm"; h = h % 12 or 12
        return f"{h}{suffix}"
    return f"{_fmt(start)} – {_fmt(end)}"

def _mask_name(full_name):
    parts = full_name.strip().split()
    return f"{parts[0]} {parts[-1][0]}." if len(parts) >= 2 else (parts[0] if parts else "Customer")

def _mask_phone(phone):
    if not phone: return "—"
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) == 11 and digits[0] == "1": digits = digits[1:]
    if len(digits) == 10: return f"({digits[:3]}) {digits[3:6]}-••••"
    return "••••"

def _validate_token(stored, provided):
    if not stored or not hmac.compare_digest(stored, provided):
        raise HTTPException(status_code=403, detail="Invalid or expired job link.")

class AddressOut(BaseModel):
    street: str; city: str; state: str; zip: str

class ProJobCardResponse(BaseModel):
    job_id: str; service_name: str; service_description: str
    customer_display_name: str; customer_phone_masked: str
    address: AddressOut; quoted_price_cents: int
    scheduled_date: str; scheduled_window: str
    photos: list[str]; scoping_notes: str; status: str

class AcceptBody(BaseModel):
    token: str

class AcceptResponse(BaseModel):
    confirmed: bool

@router.get("/pros/jobs/{job_id}", response_model=ProJobCardResponse)
async def get_pro_job(job_id: str, token: str = "", db: AsyncSession = Depends(get_db)):
    try:
        jid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Job not found.")
    result = await db.execute(select(Job).where(Job.id == jid).options(
        selectinload(Job.customer), selectinload(Job.address), selectinload(Job.job_code)))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    _validate_token(job.pro_accept_token, token)
    return ProJobCardResponse(
        job_id=str(job.id), service_name=job.job_code.name,
        service_description=job.job_code.description,
        customer_display_name=_mask_name(job.customer.name),
        customer_phone_masked=_mask_phone(job.customer.phone),
        address=AddressOut(street=job.address.street, city=job.address.city,
            state=job.address.state, zip=job.address.zip),
        quoted_price_cents=job.quoted_price_cents,
        scheduled_date=job.scheduled_date.isoformat() if job.scheduled_date else "TBD",
        scheduled_window=_format_window(job.scheduled_window_start, job.scheduled_window_end),
        photos=[], scoping_notes="", status=job.status.value)

@router.post("/pros/jobs/{job_id}/accept", response_model=AcceptResponse)
async def accept_job(job_id: str, body: AcceptBody, db: AsyncSession = Depends(get_db)):
    try:
        jid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Job not found.")
    result = await db.execute(select(Job).where(Job.id == jid).options(selectinload(Job.customer)))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    _validate_token(job.pro_accept_token, body.token)
    if job.status != JobStatusEnum.pending_pro_accept:
        raise HTTPException(status_code=409, detail=f"Job already in status '{job.status.value}'.")
    pro_result = await db.execute(select(Pro).where(Pro.status == ProStatusEnum.active).limit(1))
    pro = pro_result.scalar_one_or_none()
    if pro is None:
        raise HTTPException(status_code=500, detail="No active pro found.")
    job.status = JobStatusEnum.confirmed
    job.pro_id = pro.id
    await db.commit()
    send_sms(to=job.customer.phone or "", body=customer_job_confirmed(
        pro_name=pro.name,
        scheduled_date=job.scheduled_date.isoformat() if job.scheduled_date else "TBD",
        scheduled_window=_format_window(job.scheduled_window_start, job.scheduled_window_end)),
        settings=settings)
    return AcceptResponse(confirmed=True)
```

---

### `packages/sms/client.py`

```python
from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from core.config import Settings

def send_sms(to: str, body: str, settings: "Settings") -> None:
    # Always log — easy to grab the accept URL during local testing
    print(f"\n{'─'*60}\n📱 SMS\nTo:   {to}\nBody: {body}\n{'─'*60}\n")
    if not settings.twilio_configured:
        return
    from twilio.rest import Client
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(body=body, from_=settings.TWILIO_FROM_NUMBER, to=to)
```

---

### `packages/sms/templates.py`

```python
def pro_job_offer(service_name, city, price_dollars, accept_url) -> str:
    return (f"HomeBase: New job — {service_name} in {city}. "
            f"Guaranteed ${price_dollars}. Review & accept: {accept_url}")

def customer_job_confirmed(pro_name, scheduled_date, scheduled_window) -> str:
    return (f"HomeBase: Your plumber is confirmed! "
            f"{pro_name} will arrive {scheduled_date} between {scheduled_window}. "
            f"You'll get a reminder the morning of.")
```

---

### `packages/scoping/engine.py`

```python
"""ScopingEngine — orchestrates multi-turn Claude conversation for plumbing diagnosis."""
from __future__ import annotations
import uuid
from pathlib import Path
from typing import Optional
from uuid import UUID
import anthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.base import ChannelEnum, ConfidenceTierEnum, ScopingSessionStatusEnum
from db.models.pricing import JobCode
from db.models.scoping import ScopingSession
from scoping.classifier import detect_classification, get_confidence_tier

_SYSTEM_PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "scoping" / "system.md"
_MODEL = "claude-sonnet-4-6"
_MAX_TOKENS = 1024

class ScopingEngine:
    def __init__(self, db: AsyncSession, anthropic_api_key: str) -> None:
        self.db = db
        self._client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
        self._system_prompt = _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")

    async def start_session(self, initial_message: str, channel: str = "web"):
        try:
            channel_enum = ChannelEnum(channel)
        except ValueError:
            channel_enum = ChannelEnum.web
        session = ScopingSession(id=uuid.uuid4(), channel=channel_enum,
            conversation_history=[], adjustment_flags={},
            status=ScopingSessionStatusEnum.in_progress)
        self.db.add(session)
        await self.db.flush()
        history = [{"role": "user", "content": initial_message}]
        reply = await self._call_claude(history)
        history.append({"role": "assistant", "content": reply})
        session.conversation_history = history
        await self.db.flush()
        classification = detect_classification(reply)
        if classification:
            await self._finalise_session(session, classification)
        await self.db.commit()
        await self.db.refresh(session)
        return session, reply

    async def continue_session(self, session_id: UUID, user_message: str):
        result = await self.db.execute(select(ScopingSession).where(ScopingSession.id == session_id))
        session = result.scalar_one_or_none()
        if session is None:
            raise ValueError(f"Scoping session {session_id} not found")
        if session.status != ScopingSessionStatusEnum.in_progress:
            raise ValueError(f"Session {session_id} is already {session.status.value}")
        history = list(session.conversation_history or [])
        history.append({"role": "user", "content": user_message})
        reply = await self._call_claude(history)
        history.append({"role": "assistant", "content": reply})
        session.conversation_history = history
        await self.db.flush()
        classification = detect_classification(reply)
        if classification:
            await self._finalise_session(session, classification)
        await self.db.commit()
        await self.db.refresh(session)
        return session, reply, classification

    async def _call_claude(self, history):
        response = await self._client.messages.create(
            model=_MODEL, max_tokens=_MAX_TOKENS,
            system=self._system_prompt, messages=history)
        return response.content[0].text

    async def _finalise_session(self, session, classification):
        result = await self.db.execute(select(JobCode).where(JobCode.code == classification["job_code"]))
        job_code_row = result.scalar_one_or_none()
        if job_code_row is None:
            return  # Claude hallucinated a code — stay in_progress
        confidence = classification["confidence"]
        tier_str = get_confidence_tier(confidence)
        session.classified_job_code_id = job_code_row.id
        session.confidence_score = confidence
        session.confidence_tier = ConfidenceTierEnum(tier_str)
        session.adjustment_flags = classification.get("adjustment_flags", {})
        session.status = ScopingSessionStatusEnum.completed
        await self.db.flush()
```

---

### `packages/scoping/classifier.py`

```python
"""Detects and parses Claude's classification JSON from response text."""
from __future__ import annotations
import json

_REQUIRED_KEYS = {"job_code", "confidence", "reasoning", "adjustment_flags"}
VALID_JOB_CODES = {f"PLM-{str(i).zfill(3)}" for i in range(1, 16)}

def _find_json_objects(text: str) -> list[str]:
    """Extract JSON objects using bracket-depth counting (handles nested objects)."""
    objects = []
    i = 0
    while i < len(text):
        if text[i] != '{':
            i += 1; continue
        depth = 0; in_string = False; escape_next = False; j = i
        while j < len(text):
            c = text[j]
            if escape_next: escape_next = False
            elif c == '\\' and in_string: escape_next = True
            elif c == '"': in_string = not in_string
            elif not in_string:
                if c == '{': depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0:
                        objects.append(text[i:j + 1]); i = j; break
            j += 1
        i += 1
    return objects

def detect_classification(text: str) -> dict | None:
    if '"classification"' not in text:
        return None
    for candidate in _find_json_objects(text):
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if data.get("classification") is not True: continue
        if not _REQUIRED_KEYS.issubset(data.keys()): continue
        if data.get("job_code") not in VALID_JOB_CODES: continue
        confidence = data.get("confidence")
        if not isinstance(confidence, int) or not (0 <= confidence <= 100): continue
        flags = data.get("adjustment_flags", {})
        if not isinstance(flags, dict): continue
        if not {"old_home", "accessibility", "after_hours", "weekend"}.issubset(flags.keys()): continue
        return data
    return None

def get_confidence_tier(confidence: int) -> str:
    if confidence >= 75: return "tier1"
    elif confidence >= 50: return "tier2"
    else: return "tier3"
```

---

### `packages/scoping/pricer.py`

```python
"""Calculate final quoted price with multipliers then flat adds."""
from __future__ import annotations
import math
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.pricing import JobCode, PriceAdjustment

async def calculate_quote(db: AsyncSession, job_code_id: UUID, adjustment_flags: dict) -> dict:
    result = await db.execute(select(JobCode).where(JobCode.id == job_code_id))
    job_code_row = result.scalar_one()
    base = job_code_row.base_price_cents
    adj_result = await db.execute(select(PriceAdjustment).where(PriceAdjustment.job_code_id == job_code_id))
    all_adjustments = adj_result.scalars().all()
    adj_by_type = {a.adjustment_type.value: a for a in all_adjustments}
    running_price = float(base)
    applied = []
    price_breakdown = [{"label": job_code_row.name, "amount_cents": base}]
    # Multipliers first
    for flag_name in ["old_home"]:
        if adjustment_flags.get(flag_name) and flag_name in adj_by_type:
            adj = adj_by_type[flag_name]
            if adj.multiplier is not None:
                new_price = running_price * adj.multiplier
                delta = math.ceil(new_price - running_price)
                running_price = new_price
                applied.append(adj.description)
                price_breakdown.append({"label": adj.description, "amount_cents": delta})
    # Flat adds second
    for flag_name in ["accessibility", "after_hours", "weekend"]:
        if adjustment_flags.get(flag_name) and flag_name in adj_by_type:
            adj = adj_by_type[flag_name]
            if adj.flat_add_cents is not None:
                running_price += adj.flat_add_cents
                applied.append(adj.description)
                price_breakdown.append({"label": adj.description, "amount_cents": adj.flat_add_cents})
    return {
        "job_code": job_code_row.code, "job_name": job_code_row.name,
        "base_price_cents": base, "final_price_cents": math.ceil(running_price),
        "adjustments_applied": applied, "price_breakdown": price_breakdown,
        "estimated_duration_min": job_code_row.estimated_duration_min,
    }
```

---

### `apps/web/lib/types.ts`

```typescript
export type ConfidenceTier = "tier1" | "tier2" | "tier3";
export type JobStatus = "pending_pro_accept" | "confirmed" | "en_route" | "arrived" | "in_progress" | "completed" | "cancelled";

export interface ScopingQuoteData {
  job_code: string; job_name: string; final_price_cents: number;
  confidence_tier: ConfidenceTier; estimated_duration_min: number;
}

export interface ChatMessage {
  role: "user" | "assistant"; content: string;
  quoteData?: ScopingQuoteData;
}

export interface ScopingResponse {
  session_id: string; message: string; is_classified: boolean; quote?: ScopingQuoteData;
}

export interface QuoteData {
  session_id: string;
  job_code: { code: string; name: string; description: string;
    estimated_duration_min: number; parts_included: boolean; category: string; };
  quoted_price_cents: number;
  price_breakdown: Array<{ label: string; amount_cents: number; }>;
  whats_included: string[];
  confidence_tier: ConfidenceTier;
  adjustment_flags: { old_home: boolean; accessibility: boolean; after_hours: boolean; weekend: boolean; };
}

export interface BookingRequest {
  session_id: string;
  customer: { name: string; email: string; phone: string; };
  address: { street: string; city: string; state: string; zip: string;
    property_year_built?: number; accessibility_issues?: boolean; };
  scheduled_window: "morning" | "afternoon" | "emergency";
  scheduled_date: string;
}

export interface BookingResponse {
  job_id: string; customer_id: string; client_secret: string;
  stripe_customer_id: string; quoted_price_cents: number;
}

export interface ProJobCard {
  job_id: string; service_name: string; service_description: string;
  customer_display_name: string; customer_phone_masked: string;
  address: { street: string; city: string; state: string; zip: string; };
  quoted_price_cents: number; scheduled_date: string; scheduled_window: string;
  photos: string[]; scoping_notes: string; status: JobStatus;
}

export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string; } | null;
}
```

---

### `apps/web/lib/api-client.ts`

```typescript
import type { ApiResponse, ScopingResponse, QuoteData, BookingRequest, BookingResponse } from "./types";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options, headers: { "Content-Type": "application/json", ...options.headers },
  });
  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error || { code: "UNKNOWN_ERROR", message: "Unexpected error" } };
  if ("data" in json) return json as ApiResponse<T>;
  return { data: json as T, error: null };
}

export const startScopingSession = (msg: string) =>
  request<ScopingResponse>("/scoping/start", { method: "POST", body: JSON.stringify({ initial_message: msg, channel: "web" }) });

export const sendScopingMessage = (sessionId: string, message: string) =>
  request<ScopingResponse>("/scoping/message", { method: "POST", body: JSON.stringify({ session_id: sessionId, message }) });

export const getQuote = (sessionId: string) => request<QuoteData>(`/quotes/${sessionId}`);

export const createBooking = (booking: BookingRequest) =>
  request<BookingResponse>("/bookings", { method: "POST", body: JSON.stringify(booking) });
```

---

### `apps/web/hooks/useChat.ts`

```typescript
"use client";
import { useState, useEffect } from "react";
import type { ChatMessage, ScopingQuoteData } from "@/lib/types";
import { startScopingSession, sendScopingMessage } from "@/lib/api-client";

const STORAGE_KEY = "homebase_chat";
const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm HomeBase's plumbing specialist. I'll help you figure out what's going on and give you a guaranteed fixed price in just a few questions.\n\nWhat's the plumbing issue today?",
};

function loadFromStorage() {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToStorage(messages: ChatMessage[], sessionId: string | null) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, sessionId })); } catch {}
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) { setMessages(stored.messages); setSessionId(stored.sessionId); }
    setIsMounted(true);
  }, []);

  const updateMessages = (msgs: ChatMessage[], sid: string | null) => {
    setMessages(msgs); saveToStorage(msgs, sid);
  };

  const clearChat = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setMessages([GREETING]); setSessionId(null);
  };

  const sendMessage = async (userMessage: string) => {
    if (isLoading) return;
    const currentSid = sessionId;
    const withUser = [...messages, { role: "user" as const, content: userMessage }];
    updateMessages(withUser, currentSid);
    setIsLoading(true);
    try {
      const response = !currentSid
        ? await startScopingSession(userMessage)
        : await sendScopingMessage(currentSid, userMessage);
      if (response.error || !response.data) {
        updateMessages([...withUser, { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }], currentSid);
        return;
      }
      const { session_id, message, is_classified, quote: quoteData } = response.data;
      const newSid = currentSid ?? session_id;
      if (!currentSid) setSessionId(newSid);
      if (is_classified && quoteData) {
        updateMessages([...withUser, { role: "assistant", content: message },
          { role: "assistant", content: "", quoteData: quoteData as ScopingQuoteData }], newSid);
      } else {
        updateMessages([...withUser, { role: "assistant", content: message }], newSid);
      }
    } catch {
      updateMessages([...withUser, { role: "assistant", content: "Something went wrong. Please refresh." }], currentSid);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sessionId, sendMessage, clearChat, isMounted };
}
```

---

### `apps/web/app/chat/page.tsx`

```typescript
"use client";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { messages, isLoading, sessionId, sendMessage, clearChat, isMounted } = useChat();
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col h-full">
        <ChatWindow messages={messages} isLoading={isLoading} sessionId={sessionId}
          onSend={sendMessage} onClear={clearChat} isMounted={isMounted} />
      </div>
    </div>
  );
}
```

---

### `apps/web/app/quote/[sessionId]/page.tsx`

```typescript
"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuoteCard } from "@/components/quote/QuoteCard";
import { BookingForm } from "@/components/quote/BookingForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getQuote, createBooking } from "@/lib/api-client";
import type { QuoteData, BookingRequest } from "@/lib/types";

export default function QuotePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuote(sessionId).then(res => {
      if (res.error || !res.data) setError("Could not load your quote.");
      else setQuote(res.data);
      setIsLoading(false);
    });
  }, [sessionId]);

  const handleBooking = async (bookingData: BookingRequest) => {
    setIsSubmitting(true);
    try {
      const res = await createBooking(bookingData);
      if (res.error || !res.data) { setError("Failed to create booking."); return; }
      const { job_id, client_secret, quoted_price_cents } = res.data;
      router.push(`/booking/${job_id}?cs=${encodeURIComponent(client_secret)}&price=${quoted_price_cents}`);
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size={32} /></div>;
  if (error || !quote) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-600 font-medium mb-4">{error || "Something went wrong."}</p>
        <button onClick={() => router.push("/chat")} className="text-blue-600 underline text-sm">Start over</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <QuoteCard quote={quote} />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Book this job</h2>
            <BookingForm quote={quote} onSubmit={handleBooking} isSubmitting={isSubmitting} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### `apps/web/app/booking/[jobId]/page.tsx`

```typescript
"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";

// Sprint 3: Shows success card directly (no Stripe yet).
// Sprint 4: Replace with Stripe Elements card form when client_secret is present.
export default function BookingPaymentPage({ params }: { params: { jobId: string } }) {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get("cs") || "";

  // NOTE: params.jobId used directly here — needs React.use(params) fix for Next.js 16
  // (same fix already applied to pro/jobs/[jobId]/page.tsx)

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card padding="lg" className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Received!</h1>
          <p className="text-gray-600 text-sm mb-4">
            We&apos;re finding the best plumber for your job. You&apos;ll receive a text confirmation within 30 minutes once a pro accepts.
          </p>
          <p className="text-xs text-gray-400">Check your text messages for updates.</p>
        </Card>
      </div>
    );
  }
  // TODO Sprint 4: render Stripe Elements here when clientSecret is present
  return null;
}
```

---

### `apps/web/app/pro/jobs/[jobId]/page.tsx`

```typescript
"use client";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { ProJobCard } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

export default function ProJobCardPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);  // Next.js 16: params is a Promise
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [job, setJob] = useState<ProJobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/pros/jobs/${jobId}?token=${encodeURIComponent(token)}`)
      .then(res => { if (!res.ok) { setError("Job not found or link expired."); return null; } return res.json(); })
      .then(data => { if (data) setJob(data.data || data); })
      .catch(() => setError("Failed to load job details."))
      .finally(() => setIsLoading(false));
  }, [jobId, token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await fetch(`${API_URL}/pros/jobs/${jobId}/accept`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) { const d = await res.json(); setError(d?.error?.message || "Failed to accept."); return; }
      setAccepted(true);
    } catch { setError("Network error."); }
    finally { setIsAccepting(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size={32} /></div>;
  if (accepted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card padding="lg" className="max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Job Accepted</h2>
        <p className="text-sm text-gray-600">The customer has been notified.</p>
      </Card>
    </div>
  );
  if (error || !job) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-red-600">{error || "Job not found."}</p>
    </div>
  );

  const priceDollars = (job.quoted_price_cents / 100).toFixed(0);
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Job summary card */}
        <Card padding="md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-bold text-lg text-gray-900">{job.service_name}</h2>
              <Badge label="Awaiting Response" variant="yellow" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-blue-700">${priceDollars}</p>
              <p className="text-xs text-gray-500">guaranteed price</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{job.service_description}</p>
        </Card>
        {/* Details card */}
        <Card padding="md">
          <p className="text-sm text-gray-700">{job.address.street}, {job.address.city}, {job.address.state} {job.address.zip}</p>
          <p className="text-sm text-gray-700 mt-1">{job.scheduled_date} · {job.scheduled_window}</p>
          <p className="text-sm text-gray-700 mt-1">{job.customer_display_name} · {job.customer_phone_masked}</p>
        </Card>
        {/* CTA */}
        {!declined && (
          <div className="space-y-2 pb-6">
            <Button variant="primary" size="lg" className="w-full" onClick={handleAccept} loading={isAccepting}>
              Accept Job — ${priceDollars}
            </Button>
            <Button variant="ghost" size="lg" className="w-full text-gray-500"
              onClick={() => setDeclined(true)} disabled={isAccepting}>
              I can&apos;t do this job
            </Button>
          </div>
        )}
        {declined && <Card padding="md" className="text-center"><p className="text-sm text-gray-600">Got it. We&apos;ll find another plumber.</p></Card>}
      </div>
    </div>
  );
}
```

---

### `prompts/scoping/system.md` (abridged — key rules)

```markdown
You are a friendly plumbing diagnosis assistant for HomeBase.
Classify issues into one of 15 job codes. Ask max 3-4 questions. Never mention prices.

Job codes: PLM-001 Faucet Leak ($185) through PLM-015 Main Shutoff Valve ($385)

Rules:
- Max 4 clarifying questions, then classify
- Output classification JSON at end of response when ready
- Format: {"classification": true, "job_code": "PLM-001", "confidence": 85,
           "reasoning": "...", "adjustment_flags": {"old_home": false, "accessibility": false,
           "after_hours": false, "weekend": false}}
- Confidence ≥ 75: tier1 (guaranteed). 50-74: tier2. <50: ask more.
- adjustment_flags: old_home=true if home built before 1970
```

---

## DB Schema (key tables)

```
customers: id, name, email (unique), phone, stripe_customer_id
addresses: id, customer_id, street, city, state, zip, lat, lng, property_year_built
pros: id, name, phone (unique), email, license_number, status (active/paused/removed), avg_rating
job_codes: id, code (PLM-001..015), name, base_price_cents, estimated_duration_min, category
price_adjustments: id, job_code_id, adjustment_type (old_home/accessibility/after_hours/weekend), multiplier, flat_add_cents
scoping_sessions: id, customer_id, channel, conversation_history (JSONB), classified_job_code_id, confidence_score, adjustment_flags (JSONB), status
jobs: id, customer_id, pro_id, address_id, scoping_session_id, job_code_id, quoted_price_cents, scheduled_date, scheduled_window_start, scheduled_window_end, status (pending_pro_accept/confirmed/...), pro_accept_token, stripe_payment_intent_id
```

---

## What's Not Done Yet

| Feature | Notes |
|---------|-------|
| Stripe payments | Sprint 4 deferred. StripeCardForm component exists but not wired. |
| Real SMS delivery | Toll-free Twilio number needs carrier verification. Console log works in dev. |
| Deployment | Not yet on Railway/Vercel. GitHub remote not set up. |
| Pro matching | Always picks first active pro. No geo/availability matching. |
| Auth for pros | Token-only. No pro account system. |
| Photo uploads | Supabase bucket configured but upload not built. |
| Voice channel | ChannelEnum has `voice` but no handler. |
| Pro "can't do this job" | Button exists on UI but no backend handler — decline just shows UI message. |
