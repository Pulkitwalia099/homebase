"""
routers/scoping.py — AI Scoping Engine endpoints.

POST /v1/scoping/start    — Start a new scoping conversation
POST /v1/scoping/message  — Send the next message in an existing conversation
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


# ── Request / Response shapes ─────────────────────────────────────────────────


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


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_engine(db: AsyncSession) -> ScopingEngine:
    """Construct a ScopingEngine using the injected DB session and settings."""
    settings = get_settings()
    return ScopingEngine(db=db, anthropic_api_key=settings.ANTHROPIC_API_KEY)


async def _build_quote_if_classified(
    session: ScopingSession, db: AsyncSession
) -> Optional[dict]:
    """If the session has been classified, calculate and return the quote dict."""
    if session.classified_job_code_id is None:
        return None
    quote = await calculate_quote(
        db=db,
        job_code_id=session.classified_job_code_id,
        adjustment_flags=session.adjustment_flags or {},
    )
    quote["confidence"] = session.confidence_score
    quote["confidence_tier"] = session.confidence_tier.value if session.confidence_tier else None
    return quote


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/scoping/start", response_model=ScopingResponse)
async def start_scoping(body: StartRequest, db: AsyncSession = Depends(get_db)):
    """
    Start a new AI scoping conversation.

    The customer's first message is sent to Claude, which replies with a
    clarifying question or (rarely) an immediate classification.
    """
    engine = _make_engine(db)
    session, reply = await engine.start_session(
        initial_message=body.initial_message,
        channel=body.channel,
    )

    is_classified = session.classified_job_code_id is not None
    quote = await _build_quote_if_classified(session, db) if is_classified else None

    return ScopingResponse(
        session_id=str(session.id),
        message=reply,
        is_classified=is_classified,
        quote=quote,
    )


@router.post("/scoping/message", response_model=ScopingResponse)
async def send_message(body: MessageRequest, db: AsyncSession = Depends(get_db)):
    """
    Send the next customer message in an existing scoping conversation.

    Returns Claude's reply. Once Claude has classified the issue, `is_classified`
    will be `true` and the `quote` object will be populated.
    """
    # Parse session_id — return a clear error if it's not a valid UUID
    try:
        session_id = uuid.UUID(body.session_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="session_id must be a valid UUID")

    engine = _make_engine(db)
    try:
        session, reply, _classification = await engine.continue_session(
            session_id=session_id,
            user_message=body.message,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    is_classified = session.classified_job_code_id is not None
    quote = await _build_quote_if_classified(session, db) if is_classified else None

    return ScopingResponse(
        session_id=str(session.id),
        message=reply,
        is_classified=is_classified,
        quote=quote,
    )


@router.get("/scoping/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve full state for a scoping session.

    Useful for debugging and for the frontend to poll session status.
    """
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
        "channel": session.channel.value,
        "classified_job_code_id": str(session.classified_job_code_id) if session.classified_job_code_id else None,
        "confidence_score": session.confidence_score,
        "confidence_tier": session.confidence_tier.value if session.confidence_tier else None,
        "adjustment_flags": session.adjustment_flags,
        "turn_count": len(session.conversation_history) // 2 if session.conversation_history else 0,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
    }
