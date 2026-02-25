"""
routers/pros.py — Pro-facing endpoints.

GET  /v1/pros/jobs/{job_id}?token={token}
    Returns job details for the pro's job card page.
    Token must match job.pro_accept_token — proves the request came via the SMS link.

POST /v1/pros/jobs/{job_id}/accept
    Body: { "token": str }
    Pro accepts the job. Sets status=confirmed, assigns pro_id, sends customer SMS.
"""

from __future__ import annotations

import hmac
import uuid
from datetime import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.config import get_settings
from core.database import get_db
from db.models.base import JobStatusEnum, ProStatusEnum
from db.models.customer import Customer
from db.models.job import Job
from db.models.pricing import JobCode
from db.models.pro import Pro
from sms.client import send_sms
from sms.templates import customer_job_confirmed

router = APIRouter(tags=["pros"])

settings = get_settings()


# ── Helpers ───────────────────────────────────────────────────────────────────


def _format_window(start: time | None, end: time | None) -> str:
    """Convert DB time fields to a human-readable window string."""
    if start is None or end is None:
        return "TBD"
    if start == time(0, 0) and end == time(23, 59):
        return "ASAP (Emergency)"

    def _fmt(t: time) -> str:
        h = t.hour
        suffix = "am" if h < 12 else "pm"
        h = h % 12 or 12          # 0 → 12, 13 → 1, etc.
        return f"{h}{suffix}"

    return f"{_fmt(start)} – {_fmt(end)}"


def _mask_name(full_name: str) -> str:
    """'Sarah Miller' → 'Sarah M.'  |  'Sarah' → 'Sarah'"""
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[-1][0]}."
    return parts[0] if parts else "Customer"


def _mask_phone(phone: str | None) -> str:
    """'+15125554567' → '(512) 555-••••'  — always shows area code, hides rest."""
    if not phone:
        return "—"
    digits = "".join(c for c in phone if c.isdigit())
    # Strip leading country code (1 for US)
    if len(digits) == 11 and digits[0] == "1":
        digits = digits[1:]
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-••••"
    return "••••"


def _validate_token(stored: str | None, provided: str) -> None:
    """403 if token doesn't match. Uses hmac.compare_digest to prevent timing attacks."""
    if not stored or not hmac.compare_digest(stored, provided):
        raise HTTPException(status_code=403, detail="Invalid or expired job link.")


# ── Response / Request shapes ─────────────────────────────────────────────────


class AddressOut(BaseModel):
    street: str
    city: str
    state: str
    zip: str


class ProJobCardResponse(BaseModel):
    job_id: str
    service_name: str
    service_description: str
    customer_display_name: str
    customer_phone_masked: str
    address: AddressOut
    quoted_price_cents: int
    scheduled_date: str
    scheduled_window: str
    photos: list[str]
    scoping_notes: str
    status: str


class AcceptBody(BaseModel):
    token: str


class AcceptResponse(BaseModel):
    confirmed: bool


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/pros/jobs/{job_id}", response_model=ProJobCardResponse)
async def get_pro_job(
    job_id: str,
    token: str = "",
    db: AsyncSession = Depends(get_db),
) -> ProJobCardResponse:
    """
    Return job details for the pro's job card.

    The token query param must match job.pro_accept_token.
    """
    # Parse UUID
    try:
        jid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Load job with all related rows in a single query
    result = await db.execute(
        select(Job)
        .where(Job.id == jid)
        .options(
            selectinload(Job.customer),
            selectinload(Job.address),
            selectinload(Job.job_code),
        )
    )
    job = result.scalar_one_or_none()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    _validate_token(job.pro_accept_token, token)

    scheduled_date_str = (
        job.scheduled_date.isoformat() if job.scheduled_date else "TBD"
    )
    scheduled_window_str = _format_window(
        job.scheduled_window_start, job.scheduled_window_end
    )

    return ProJobCardResponse(
        job_id=str(job.id),
        service_name=job.job_code.name,
        service_description=job.job_code.description,
        customer_display_name=_mask_name(job.customer.name),
        customer_phone_masked=_mask_phone(job.customer.phone),
        address=AddressOut(
            street=job.address.street,
            city=job.address.city,
            state=job.address.state,
            zip=job.address.zip,
        ),
        quoted_price_cents=job.quoted_price_cents,
        scheduled_date=scheduled_date_str,
        scheduled_window=scheduled_window_str,
        photos=[],           # photo uploads not in prototype
        scoping_notes="",    # conversation reasoning not surfaced yet
        status=job.status.value,
    )


@router.post("/pros/jobs/{job_id}/accept", response_model=AcceptResponse)
async def accept_job(
    job_id: str,
    body: AcceptBody,
    db: AsyncSession = Depends(get_db),
) -> AcceptResponse:
    """
    Pro accepts a job.

    Validates the token, sets status=confirmed, assigns the pro, and sends the
    customer a confirmation SMS.
    """
    # Parse UUID
    try:
        jid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Load job + customer
    result = await db.execute(
        select(Job)
        .where(Job.id == jid)
        .options(selectinload(Job.customer))
    )
    job = result.scalar_one_or_none()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    _validate_token(job.pro_accept_token, body.token)

    # Idempotency guard — don't double-confirm
    if job.status != JobStatusEnum.pending_pro_accept:
        raise HTTPException(
            status_code=409,
            detail=f"Job is already in status '{job.status.value}' and cannot be accepted again.",
        )

    # Find the active pro (Sprint 5: one pro in seed data)
    pro_result = await db.execute(
        select(Pro).where(Pro.status == ProStatusEnum.active).limit(1)
    )
    pro = pro_result.scalar_one_or_none()
    if pro is None:
        raise HTTPException(status_code=500, detail="No active pro found to assign.")

    # Update job
    job.status = JobStatusEnum.confirmed
    job.pro_id = pro.id
    await db.commit()

    # Send confirmation SMS to customer
    scheduled_date_str = (
        job.scheduled_date.isoformat() if job.scheduled_date else "TBD"
    )
    scheduled_window_str = _format_window(
        job.scheduled_window_start, job.scheduled_window_end
    )
    send_sms(
        to=job.customer.phone or "",
        body=customer_job_confirmed(
            pro_name=pro.name,
            scheduled_date=scheduled_date_str,
            scheduled_window=scheduled_window_str,
        ),
        settings=settings,
    )

    return AcceptResponse(confirmed=True)
