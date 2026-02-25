"""
routers/quotes.py — Quote retrieval endpoint.

GET /v1/quotes/{session_id}

After the scoping chat classifies a job, the frontend redirects to /quote/{sessionId}.
That page immediately calls this endpoint to load the full quote data for display.
"""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from db.models.scoping import ScopingSession
from db.models.pricing import JobCode
from scoping.pricer import calculate_quote

router = APIRouter(tags=["quotes"])


# ── Response shape ────────────────────────────────────────────────────────────
# Mirrors the frontend's QuoteData TypeScript type in apps/web/lib/types.ts


class JobCodeSummary(BaseModel):
    code: str
    name: str
    description: str
    estimated_duration_min: int
    parts_included: bool
    category: str


class PriceBreakdownItem(BaseModel):
    label: str
    amount_cents: int


class AdjustmentFlags(BaseModel):
    old_home: bool
    accessibility: bool
    after_hours: bool
    weekend: bool


class QuoteResponse(BaseModel):
    session_id: str
    job_code: JobCodeSummary
    quoted_price_cents: int
    price_breakdown: list[PriceBreakdownItem]
    whats_included: list[str]  # built client-side in QuoteCard; returned empty here
    confidence_tier: str
    adjustment_flags: AdjustmentFlags


# ── Endpoint ──────────────────────────────────────────────────────────────────


@router.get("/quotes/{session_id}", response_model=QuoteResponse)
async def get_quote(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Return the quote for a completed scoping session.

    The session must already be classified (classified_job_code_id set) —
    if not, returns 404 so the frontend can show an error and ask the customer
    to go back and finish the chat.
    """
    # 1. Parse the UUID — give a clear error if malformed
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="session_id must be a valid UUID")

    # 2. Load the scoping session
    result = await db.execute(select(ScopingSession).where(ScopingSession.id == sid))
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    # 3. Must be classified before a quote can be shown
    if session.classified_job_code_id is None:
        raise HTTPException(
            status_code=404,
            detail="This session has not been classified yet. Continue the chat to get a quote.",
        )

    # 4. Load the job code row (for description, category, parts_included, etc.)
    jc_result = await db.execute(
        select(JobCode).where(JobCode.id == session.classified_job_code_id)
    )
    job_code_row = jc_result.scalar_one()

    # 5. Calculate the final price (multipliers + flat adds applied)
    flags = session.adjustment_flags or {}
    quote = await calculate_quote(
        db=db,
        job_code_id=session.classified_job_code_id,
        adjustment_flags=flags,
    )

    return QuoteResponse(
        session_id=str(session.id),
        job_code=JobCodeSummary(
            code=job_code_row.code,
            name=job_code_row.name,
            description=job_code_row.description,
            estimated_duration_min=job_code_row.estimated_duration_min,
            parts_included=job_code_row.parts_included,
            category=job_code_row.category,
        ),
        quoted_price_cents=quote["final_price_cents"],
        price_breakdown=[
            PriceBreakdownItem(label=item["label"], amount_cents=item["amount_cents"])
            for item in quote["price_breakdown"]
        ],
        whats_included=[],  # QuoteCard builds this list client-side from job_code fields
        confidence_tier=session.confidence_tier.value if session.confidence_tier else "tier1",
        adjustment_flags=AdjustmentFlags(
            old_home=bool(flags.get("old_home")),
            accessibility=bool(flags.get("accessibility")),
            after_hours=bool(flags.get("after_hours")),
            weekend=bool(flags.get("weekend")),
        ),
    )
