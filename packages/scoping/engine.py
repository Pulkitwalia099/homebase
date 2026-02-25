"""
engine.py — ScopingEngine: the main orchestrator for AI-powered plumbing diagnosis.

Responsibilities:
  1. Create and manage ScopingSession rows in the database
  2. Send messages to Claude using the full conversation history
  3. Run the classifier on every Claude response
  4. If classified, validate the job code against the DB and finalise the session

Usage (from a FastAPI endpoint):
    engine = ScopingEngine(db)
    session, reply = await engine.start_session("My faucet is dripping")
    ...
    session, reply, classification = await engine.continue_session(session.id, "It's a kitchen faucet")
"""

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

# Path to the system prompt — resolve relative to this file so it works regardless
# of which directory uvicorn is started from.
_SYSTEM_PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "scoping" / "system.md"

_MODEL = "claude-sonnet-4-6"
_MAX_TOKENS = 1024


def _load_system_prompt() -> str:
    """Read system.md from disk. Called once per ScopingEngine instance."""
    return _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")


class ScopingEngine:
    """
    Orchestrates the multi-turn Claude conversation for plumbing diagnosis.

    Each instance is tied to a single database session (injected by FastAPI).
    Create a new instance per API request — do not share across requests.
    """

    def __init__(self, db: AsyncSession, anthropic_api_key: str) -> None:
        self.db = db
        self._client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
        self._system_prompt = _load_system_prompt()

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    async def start_session(
        self, initial_message: str, channel: str = "web"
    ) -> tuple[ScopingSession, str]:
        """
        Start a brand-new scoping conversation.

        Creates a ScopingSession row, sends the customer's first message to Claude,
        saves the reply, and returns both.

        Returns:
            (session, claude_reply_text)
        """
        # Map the channel string to the enum value (default to web if unrecognised)
        try:
            channel_enum = ChannelEnum(channel)
        except ValueError:
            channel_enum = ChannelEnum.web

        # Create the session row — no classification yet
        session = ScopingSession(
            id=uuid.uuid4(),
            channel=channel_enum,
            conversation_history=[],
            adjustment_flags={},
            status=ScopingSessionStatusEnum.in_progress,
        )
        self.db.add(session)
        await self.db.flush()  # writes the row so the id exists; doesn't commit yet

        # Build the initial conversation and call Claude
        history = [{"role": "user", "content": initial_message}]
        reply = await self._call_claude(history)
        history.append({"role": "assistant", "content": reply})

        # Save the conversation history
        session.conversation_history = history
        await self.db.flush()

        # Check if Claude already classified on the first turn (unusual but possible)
        classification = detect_classification(reply)
        if classification:
            await self._finalise_session(session, classification)

        await self.db.commit()
        await self.db.refresh(session)
        return session, reply

    async def continue_session(
        self, session_id: UUID, user_message: str
    ) -> tuple[ScopingSession, str, Optional[dict]]:
        """
        Continue an existing scoping conversation.

        Loads the session, appends the customer's message, calls Claude,
        checks for classification, and saves everything.

        Returns:
            (session, claude_reply_text, classification_dict_or_None)

        Raises:
            ValueError: if session not found or already completed/abandoned
        """
        # Load the session
        result = await self.db.execute(
            select(ScopingSession).where(ScopingSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if session is None:
            raise ValueError(f"Scoping session {session_id} not found")
        if session.status != ScopingSessionStatusEnum.in_progress:
            raise ValueError(
                f"Scoping session {session_id} is already {session.status.value} — cannot add messages"
            )

        # Append the new user message to history and call Claude
        history = list(session.conversation_history or [])
        history.append({"role": "user", "content": user_message})

        reply = await self._call_claude(history)
        history.append({"role": "assistant", "content": reply})

        session.conversation_history = history
        await self.db.flush()

        # Check for classification in this response
        classification = detect_classification(reply)
        if classification:
            await self._finalise_session(session, classification)

        await self.db.commit()
        await self.db.refresh(session)
        return session, reply, classification

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    async def _call_claude(self, history: list[dict]) -> str:
        """Send the conversation history to Claude and return the text response."""
        response = await self._client.messages.create(
            model=_MODEL,
            max_tokens=_MAX_TOKENS,
            system=self._system_prompt,
            messages=history,
        )
        return response.content[0].text

    async def _finalise_session(self, session: ScopingSession, classification: dict) -> None:
        """
        Validate the classified job code against the DB and update the session row.

        IMPORTANT: We never trust the job_code string from Claude without checking
        it exists in our database first. This prevents any hallucinated codes from
        being saved (per CLAUDE.md rules).
        """
        job_code_str: str = classification["job_code"]

        # Validate the job code exists in the DB
        result = await self.db.execute(
            select(JobCode).where(JobCode.code == job_code_str)
        )
        job_code_row = result.scalar_one_or_none()

        if job_code_row is None:
            # Claude returned a code that isn't in our database — do not classify.
            # The session stays in_progress so the next user message can try again.
            return

        confidence: int = classification["confidence"]
        tier_str: str = get_confidence_tier(confidence)

        session.classified_job_code_id = job_code_row.id
        session.confidence_score = confidence
        session.confidence_tier = ConfidenceTierEnum(tier_str)
        session.adjustment_flags = classification.get("adjustment_flags", {})
        session.status = ScopingSessionStatusEnum.completed

        await self.db.flush()
