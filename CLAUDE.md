# HomeBase AI — Claude Code Project Instructions

> This file is auto-loaded by Claude Code at the start of every session.
> Keep it up to date as the project evolves.

---

## What We're Building

HomeBase AI is a **"Stripe for home services"** — a platform that standardises plumbing job scoping, pricing, and dispatch. Customers describe an issue via web chat; Claude AI scopes it and gives a guaranteed fixed price; a pro receives an SMS and accepts.

Full loop: **Chat → AI Scope → Quote → Book → Pay → Pro SMS → Accepted → Confirmed**

---

## Repo Location & Structure

```
/Users/pulkitwalia/Programs/homebase/
├── apps/web/              # Next.js 14 (TypeScript + Tailwind) — port 3000
├── packages/
│   ├── api/               # FastAPI backend — port 8000
│   ├── db/                # SQLAlchemy models + Alembic migrations
│   ├── scoping/           # AI scoping engine (Claude)
│   ├── sms/               # Twilio SMS
│   └── payments/          # Stripe
├── prompts/scoping/       # Claude system prompt lives here
├── .venv/                 # Python 3.12 virtualenv (at repo root)
├── PROGRESS.md            # Sprint tracker — always read this first
└── CLAUDE.md              # This file
```

---

## How to Start Dev Servers

```bash
# Backend (run from packages/api/)
cd /Users/pulkitwalia/Programs/homebase/packages/api
../../.venv/bin/uvicorn main:app --reload --port 8000

# Frontend (run from apps/web/)
cd /Users/pulkitwalia/Programs/homebase/apps/web
npm run dev
```

---

## Database

**Provider**: Supabase (PostgreSQL)
**Project ref**: `jgcigqxhdbqkzzrbazdf`
**Region**: `us-west-2`

### Connection URLs

| Use | URL |
|-----|-----|
| App + migrations | `postgresql+asyncpg://postgres.jgcigqxhdbqkzzrbazdf:[PASS]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require` |
| Never use | Transaction pooler port 6543 — breaks asyncpg prepared statements |
| Never use | `db.xxx.supabase.co:5432` — IPv6-only, won't resolve on Mac |

### Critical asyncpg SSL Fix

asyncpg does NOT accept `?sslmode=require` or `?ssl=true` as URL query params.
**Always** strip them and pass via `connect_args`. Use this helper:

```python
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

def _clean_db_url(url: str) -> tuple[str, dict]:
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    needs_ssl = any(k in qs for k in ("ssl", "sslmode"))
    for key in ("ssl", "sslmode"): qs.pop(key, None)
    clean = urlunparse(parsed._replace(query=urlencode(qs, doseq=True)))
    return clean, {"ssl": "require"} if needs_ssl else {}

# Then use like:
url, connect_args = _clean_db_url(database_url)
engine = create_async_engine(url, connect_args=connect_args)
```

This helper is already implemented in:
- [packages/api/core/database.py](packages/api/core/database.py)
- [packages/db/seed.py](packages/db/seed.py)
- [packages/db/migrations/env.py](packages/db/migrations/env.py)

### Run Migrations

```bash
cd packages/db
DATABASE_URL="postgresql+asyncpg://postgres.jgcigqxhdbqkzzrbazdf:[PASS]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require" \
../../.venv/bin/alembic upgrade head
```

---

## Sprint Status (see PROGRESS.md for full detail)

| Sprint | Goal | Status |
|--------|------|--------|
| Sprint 0 | Foundation: repo, DB, models, seed data | ✅ Done |
| Sprint 1 | AI Scoping Engine (Claude integration) | ✅ Done |
| Sprint 2 | Customer Web Chat UI | ✅ Done |
| Sprint 3 | Quote + Booking Screen | ✅ Done |
| Sprint 4 | Stripe Payments | ⏸ Deferred |
| Sprint 5 | Pro SMS + Job Card | ⬜ Not Started |

---

## Sprint 1 — What to Build Next

**Goal**: Claude classifies plumbing issues into job codes. API endpoints work end-to-end.

### Files to create

```
prompts/scoping/system.md          ← Claude's brain (most important file)
packages/scoping/__init__.py
packages/scoping/engine.py         ← ScopingEngine class
packages/scoping/classifier.py     ← Detects JSON classification in Claude output
packages/scoping/pricer.py         ← Applies price adjustments
packages/api/routers/scoping.py    ← POST /v1/scoping/start and /v1/scoping/message
```

### API contracts

```
POST /v1/scoping/start
  Body:  { "initial_message": str, "channel": "web" }
  Returns: { "session_id": str, "message": str, "is_classified": bool }

POST /v1/scoping/message
  Body:  { "session_id": str, "message": str }
  Returns: { "message": str, "is_classified": bool, "quote"?: {...} }

GET /v1/scoping/{session_id}
  Returns: full session state
```

### Classification format Claude must output

```json
{"classification": true, "job_code": "PLM-001", "confidence": 92, "reasoning": "..."}
```

Confidence tiers: Tier 1 ≥ 75 | Tier 2 50–74 | Tier 3 < 50

### Done when

Claude correctly classifies 5 manual test scenarios. Both endpoints return correct responses.

---

## Key Technical Patterns

### Python (FastAPI + SQLAlchemy)

- Python 3.12 venv at repo root: `.venv/`
- All packages installed: `../../.venv/bin/pip install ...` (relative to packages/api/)
- SQLAlchemy 2.0 style: `Mapped` + `mapped_column`, UUID PKs, async sessions
- Circular import fix: `from __future__ import annotations` + `TYPE_CHECKING`
- Reserved SQLAlchemy name: `metadata` → rename to `event_metadata` with column alias

### Anthropic (Claude)

- Model: `claude-sonnet-4-6`
- Use `messages.create` (not streaming) in Phase 1
- Store conversation history as JSONB in `[{role, content}]` format (Claude's native format)
- API key in: `packages/api/.env` → `ANTHROPIC_API_KEY`

### Next.js (App Router)

- Raw body in webhook routes: use `request.text()` directly — no `config` export needed
- Stripe API version: `"2026-01-28.clover"`

---

## Environment Files

| File | Purpose |
|------|---------|
| `packages/api/.env` | Backend secrets (never commit) |
| `apps/web/.env.local` | Frontend secrets (never commit) |

Stripe keys are still placeholder — fill in before Sprint 4.

---

## Rules for Claude Code in This Project

- **Read PROGRESS.md first** at the start of every session
- **Never auto-commit or push git** without explicit instruction
- **Ask before big multi-file changes**
- **Explain concepts while building** (Pulkit is learning)
- **New session per sprint** to keep context clean
- Use `../../.venv/bin/python` and `../../.venv/bin/pip` (not system Python)

---

## Claude Code Workflow Rules

- Always run in plan mode before touching any new file or module
- After every code change in packages/scoping/, run: pytest tests/scoping_scenarios/ -x --tb=short
- After every change to packages/db/models/, run: alembic check to verify no unapplied migrations
- Never modify DB models without creating a corresponding Alembic migration immediately after
- The scoping engine output MUST validate the returned job_code exists in the job_codes table — never trust a job_code from Claude API that doesn't exist in the DB
- When working on packages/scoping/, always cross-check logic against prompts/scoping/system.md
- Never hardcode environment variables. All config goes through pydantic-settings BaseSettings
- Before starting any sprint, read the sprint definition from docs/build-plan.md and state what you are about to do before writing any code

## Sub-Agent Usage

- Use the `explorer` sub-agent any time you need to search or understand the codebase before making changes
- Use the `scoping-tester` sub-agent after any change to the scoping engine to verify 80%+ accuracy
- Use the `db-validator` sub-agent after any change to DB models or migrations
