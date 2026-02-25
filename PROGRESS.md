# HomeBase AI — Build Progress

> Last updated: 2026-02-24
> Current sprint: Phase 1 Complete ✅

---

## What We're Building

HomeBase AI is a **"Stripe for home services"** — a platform that:
1. Lets property managers / homeowners **describe a plumbing issue via chat**
2. Uses **Claude AI** to diagnose the issue and give a **guaranteed fixed price**
3. Sends the job to a plumbing pro **via SMS**
4. The pro **accepts** and the customer gets confirmed — all automated

The full loop: Chat → AI Scope → Quote → Book → Pay → Pro SMS → Accepted → Confirmed

---

## Phase 1 — Functional Prototype (Sprints 0–5)

| Sprint | Goal | Status |
|--------|------|--------|
| **Sprint 0** | Foundation: repo, database, models, seed data | ✅ Done |
| **Sprint 1** | AI Scoping Engine (Claude integration) | ✅ Done |
| **Sprint 2** | Customer Web Chat UI | ✅ Done |
| **Sprint 3** | Quote + Booking Screen | ✅ Done |
| **Sprint 4** | Stripe Payments | ⏸ Deferred |
| **Sprint 5** | Pro SMS + Job Card | ✅ Done |

**Phase 1 done when**: Real person can call → describe issue → get quote → book → pro gets SMS → accepts → customer confirmed.

---

## Sprint 0 — Foundation

**Goal**: Working repo structure, database connected, all tables created, seed data loaded, FastAPI health check returns 200.

### Tasks

- [x] Monorepo directory structure created (`homebase/apps/web`, `homebase/packages/...`)
- [x] Makefile with `dev-web`, `dev-api`, `migrate`, `seed` commands
- [x] Next.js 14 app initialized in `apps/web/` (TypeScript + Tailwind)
- [x] All SQLAlchemy database models created (`packages/db/models/`)
- [x] Alembic migration config set up (`packages/db/migrations/`)
- [x] Seed data written — 15 job codes + 4 price adjustments + 1 test pro (`packages/db/seed.py`)
- [x] FastAPI skeleton: `main.py`, `core/config.py`, `core/database.py`, `core/security.py`
- [x] Health check endpoint: `GET /v1/health`
- [x] All frontend page shells created (chat, quote, booking, pro job card)
- [x] Python venv created with Python 3.12 (`.venv/`) — all 30+ packages installed
- [x] `.env` files created — fill in real keys (see instructions below)
- [x] Next.js build passes clean — all 6 routes compile
- [x] All Python models import without errors — 11 tables verified
- [ ] **YOU**: Fill in real API keys in `packages/api/.env` and `apps/web/.env.local`
- [ ] Run `alembic upgrade head` to create tables in Supabase
- [ ] Run `python seed.py` to load 15 job codes + test pro
- [ ] **Verification**: `GET /v1/health` → `{"status": "ok", "db": "connected"}`

### Done When

`alembic upgrade head` runs clean → `python seed.py` loads all 15 codes → `uvicorn` starts → health check returns 200 → Next.js builds.

---

## Sprint 1 — AI Scoping Engine

**Goal**: Claude classifies plumbing issues to job codes. POST /scoping/start and /scoping/message work end-to-end.

### Key files to build
- `prompts/scoping/system.md` — Claude's brain (most important file)
- `packages/scoping/engine.py` — ScopingEngine class
- `packages/scoping/classifier.py` — detects classification JSON in Claude's output
- `packages/scoping/pricer.py` — applies price adjustments
- `packages/api/routers/scoping.py` — API endpoints

### Done When
Claude correctly classifies 5 manual test scenarios. `/scoping/start` and `/scoping/message` endpoints work.

### Completed — 2026-02-24

All 5 files created + router registered in `main.py`:
- `prompts/scoping/system.md` — system prompt with all 15 job codes, conversation rules, classification JSON format
- `packages/scoping/__init__.py`
- `packages/scoping/classifier.py` — bracket-depth JSON parser (handles nested `adjustment_flags` object)
- `packages/scoping/pricer.py` — multipliers applied before flat adds; `math.ceil` rounding
- `packages/scoping/engine.py` — `AsyncAnthropic` client; `Path(__file__).resolve()` for path safety; DB job_code validation before saving
- `packages/api/routers/scoping.py` — `POST /v1/scoping/start`, `POST /v1/scoping/message`, `GET /v1/scoping/{session_id}`

**5/5 test scenarios passed:**
| Scenario | Code | Price | Notes |
|----------|------|-------|-------|
| Kitchen faucet dripping | PLM-001 | $185 | 4 turns |
| Toilet running (1958 home) | PLM-005 | $218.75 | old_home ×1.25 applied |
| Garbage disposal humming | PLM-008 | $165 | 3 turns |
| Slow shower drain | PLM-004 | $145 | 3 turns |
| No hot water | PLM-006 | $125 | 4 turns |

---

## Sprint 2 — Customer Web Chat UI

**Goal**: Customer can have a real AI conversation in the browser and reach the quote screen.

### Key files to build
- `apps/web/hooks/useChat.ts` ✅ (written, needs Sprint 1 backend to work)
- `apps/web/components/chat/` ✅ (all written)
- `apps/web/app/chat/page.tsx` ✅

### Done When
Full browser chat flow → AI conversation → automatic redirect to `/quote/{sessionId}`.

### Completed — 2026-02-24

All chat UI components (written in Sprint 0) wired up to the Sprint 1 scoping backend:
- `apps/web/hooks/useChat.ts` — calls `/v1/scoping/start` + `/v1/scoping/message`; auto-redirects on `is_classified=true`
- `apps/web/components/chat/` — `ChatWindow`, `ChatInput`, `MessageBubble`, `MessageList`, `TypingIndicator`
- `apps/web/app/chat/page.tsx` — full page

New backend built this sprint:
- `packages/api/routers/quotes.py` — `GET /v1/quotes/{session_id}` endpoint; loads session + job code, runs pricer, returns `QuoteData` shape
- `packages/scoping/pricer.py` — enhanced to return `price_breakdown: [{label, amount_cents}]` for the QuoteCard UI

Fixes:
- `apps/web/app/quote/[sessionId]/page.tsx` — Next.js 15/16 async `params` fix (`React.use(params)`)
- `packages/api/main.py` — `quotes` router registered

---

## Sprint 3 — Quote + Booking Screen

**Goal**: Customer sees guaranteed price, fills address + time, submits booking → job row created in DB.

### Key files to build
- `packages/api/routers/quotes.py` ✅ (built in Sprint 2)
- `packages/api/routers/bookings.py` ✅
- `apps/web/components/quote/` ✅ (written in Sprint 0)
- `apps/web/app/quote/[sessionId]/page.tsx` ✅

### Done When
Full flow: chat → quote screen loads → booking form submits → Job row created with `status=pending_pro_accept`.

### Completed — 2026-02-24

`POST /v1/bookings` endpoint built and verified end-to-end:
- `packages/api/routers/bookings.py` — finds/creates Customer by email, creates Address, creates Job row with `status=pending_pro_accept`; applies +$75 emergency surcharge when window="emergency"; always re-calculates price server-side
- `packages/api/main.py` — bookings router registered
- `apps/web/app/booking/[jobId]/page.tsx` — shows "Booking Received!" card when `client_secret` is empty (Stripe added in Sprint 4)

**Flow verified:** chat → classified → quote screen → 3-step BookingForm → "Booking Received!" → Job row in `jobs` table with `status=pending_pro_accept`

---

## Sprint 4 — Stripe Payments

> **⏸ Intentionally deferred.** Stripe adds friction to every demo and test run.
> The full loop (Chat → Scope → Quote → Book → Pro SMS → Accept → Confirm) will be
> proven first. Stripe will be added as a hardening step once Phase 1 is validated end-to-end.

**Goal**: $35 booking fee charged, card saved on file for job completion charge.

### Key files to build (when resumed)
- `packages/payments/client.py`
- `packages/api/routers/payments.py`
- `apps/web/app/booking/[jobId]/page.tsx` — swap "Booking Received" for real Stripe card form
- `apps/web/components/payment/StripeCardForm.tsx` ✅ (already written)

### Done When
Stripe test card `4242 4242 4242 4242` → $35 charged → card saved → job status updated.

---

## Sprint 5 — Pro SMS + Job Card

**Goal**: Pro receives SMS with job link, views job card, accepts, customer gets confirmation SMS.

### Completed — 2026-02-24

- `packages/sms/__init__.py` — makes sms a Python package
- `packages/sms/client.py` — Twilio wrapper; always prints to console (good for dev), sends real SMS when `twilio_configured=True`
- `packages/sms/templates.py` — `pro_job_offer()` and `customer_job_confirmed()` message templates
- `packages/api/routers/pros.py` — `GET /v1/pros/jobs/{job_id}?token=` (load job card) + `POST /v1/pros/jobs/{job_id}/accept` (set confirmed + SMS customer)
- `packages/api/routers/bookings.py` — updated to generate `pro_accept_token`, find active pro, send SMS after commit
- `apps/web/app/pro/jobs/[jobId]/page.tsx` — Next.js 16 async params fix (`React.use(params)`)

**Flow verified end-to-end:** chat → scope → quote → book → Job in DB → 📱 SMS logged → pro opens job card → Accept → 📱 customer confirmation SMS logged → `job.status = confirmed`

**SMS note:** Twilio toll-free number (+18333624504) blocked pending carrier verification. SMS content always visible in backend terminal for dev testing. Real delivery works once A2P registration is approved or a local number is used.

---

## Tech Stack Reference

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (TypeScript + Tailwind) | React framework — handles both UI and lightweight API routes |
| Backend | FastAPI (Python) | Fast async API framework — ideal for AI + database work |
| Database | PostgreSQL on Supabase | Managed Postgres — handles JSONB (flexible data storage), free tier works for dev |
| AI | Anthropic Claude (claude-sonnet-4-6) | Powers the scoping engine |
| SMS | Twilio | Industry standard for programmable SMS |
| Payments | Stripe | PCI-compliant payments + pro payouts via Stripe Connect |
| Storage | Supabase Storage | Customer photo uploads |
| Deploy | Vercel (frontend) + Railway (backend) | Both have free tiers, auto-deploy from GitHub |

---

## Key Concepts Introduced

| Term | Definition | First seen |
|------|-----------|-----------|
| **ORM** | Object-Relational Mapper — lets you write Python classes instead of raw SQL | Sprint 0 |
| **SQLAlchemy** | The ORM we use — maps Python model classes to database tables | Sprint 0 |
| **Alembic** | Migration tool for SQLAlchemy — tracks and applies DB schema changes safely | Sprint 0 |
| **Migration** | A versioned script that changes the database schema (add/remove tables, columns) | Sprint 0 |
| **Async** | Code that doesn't block while waiting — critical for high-performance APIs | Sprint 0 |
| **UUID** | Universally Unique ID — a random 128-bit ID used as primary key (unguessable, no sequential enumeration) | Sprint 0 |
| **JSONB** | PostgreSQL's binary JSON column type — stores flexible/nested data efficiently | Sprint 0 |
| **Pydantic** | Python library for data validation — reads env vars, validates API request/response shapes | Sprint 0 |
| **FastAPI** | Python web framework that auto-generates API docs and uses type hints for validation | Sprint 0 |
| **SetupIntent** | Stripe object that saves a card without charging it — used at booking time | Sprint 4 |
| **HMAC token** | A cryptographic signature used to verify the pro's SMS link is authentic | Sprint 5 |

---

## Session Handoff Notes

> When starting a new Claude Code session, reference this file to resume context.

**Repo location**: `/Users/pulkitwalia/Programs/homebase/`

**To start dev servers** (run in separate terminals):
```bash
# Backend
cd packages/api && uvicorn main:app --reload --port 8000

# Frontend
cd apps/web && npm run dev
```

**To run migrations + seed**:
```bash
cd packages/db && DATABASE_URL="your-url" alembic upgrade head
cd packages/db && DATABASE_URL="your-url" python seed.py
```
