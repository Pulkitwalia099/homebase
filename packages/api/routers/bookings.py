"""
routers/bookings.py — Booking creation endpoint.

POST /v1/bookings

After the customer reviews the quote and fills in the BookingForm (address,
schedule, contact info), this endpoint:
  1. Validates the scoping session is classified
  2. Re-calculates the final price (+ emergency surcharge if applicable)
  3. Creates/finds a Customer record
  4. Creates an Address record
  5. Creates a Job record with status=pending_pro_accept
  6. Returns the job_id so the frontend can redirect to the payment page

Stripe SetupIntent is added in Sprint 4 — for now client_secret is empty.
"""

from __future__ import annotations

import secrets
import uuid
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


# ── Request / Response shapes ─────────────────────────────────────────────────
# These mirror the BookingRequest / BookingResponse TypeScript types in
# apps/web/lib/types.ts — keep them in sync.


class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: str


class AddressCreate(BaseModel):
    street: str
    city: str
    state: str
    zip: str
    property_year_built: Optional[int] = None
    # accessibility_issues is collected by the form but has no DB column;
    # the scoping conversation already captures it in adjustment_flags.
    accessibility_issues: bool = False


class BookingRequest(BaseModel):
    session_id: uuid.UUID
    customer: CustomerCreate
    address: AddressCreate
    scheduled_window: Literal["morning", "afternoon", "emergency"]
    scheduled_date: date


class BookingResponse(BaseModel):
    job_id: str
    customer_id: str
    client_secret: str       # empty in Sprint 3 — Stripe SetupIntent added in Sprint 4
    stripe_customer_id: str  # empty in Sprint 3
    quoted_price_cents: int


# ── Helpers ───────────────────────────────────────────────────────────────────

# Maps the customer's chosen time window to start/end times stored on the Job.
_WINDOW_TIMES: dict[str, tuple[time, time]] = {
    "morning":   (time(8, 0),  time(12, 0)),
    "afternoon": (time(12, 0), time(17, 0)),
    "emergency": (time(0, 0),  time(23, 59)),  # ASAP — full day window
}

EMERGENCY_SURCHARGE_CENTS = 7_500  # +$75 for emergency/same-day bookings


# ── Endpoint ──────────────────────────────────────────────────────────────────


@router.post("/bookings", response_model=BookingResponse, status_code=201)
async def create_booking(
    body: BookingRequest,
    db: AsyncSession = Depends(get_db),
) -> BookingResponse:
    """
    Create a booking from a completed scoping session.

    The scoping session must already be classified (classified_job_code_id set).
    Creates Customer + Address + Job rows and returns the job_id.
    """

    # 1. Load and validate the scoping session ─────────────────────────────────
    result = await db.execute(
        select(ScopingSession).where(ScopingSession.id == body.session_id)
    )
    session = result.scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scoping session {body.session_id} not found.",
        )

    if session.classified_job_code_id is None:
        raise HTTPException(
            status_code=422,
            detail="This session has not been classified yet. Finish the chat to get a quote first.",
        )

    # 2. Re-calculate the final price ─────────────────────────────────────────
    # We always recalculate rather than trusting a client-sent price.
    flags = session.adjustment_flags or {}
    quote = await calculate_quote(
        db=db,
        job_code_id=session.classified_job_code_id,
        adjustment_flags=flags,
    )
    quoted_price_cents = quote["final_price_cents"]

    # Emergency bookings carry a $75 surcharge (shown in BookingForm.tsx step 2).
    if body.scheduled_window == "emergency":
        quoted_price_cents += EMERGENCY_SURCHARGE_CENTS

    # 3. Find or create the Customer ──────────────────────────────────────────
    # Email is the deduplication key (unique index on customers.email).
    cust_result = await db.execute(
        select(Customer).where(Customer.email == body.customer.email)
    )
    customer = cust_result.scalar_one_or_none()

    if customer is None:
        customer = Customer(
            name=body.customer.name,
            email=body.customer.email,
            phone=body.customer.phone,
        )
        db.add(customer)
        await db.flush()  # get the auto-generated UUID without committing yet
    else:
        # Update name/phone in case they changed (simple upsert behaviour).
        customer.name = body.customer.name
        customer.phone = body.customer.phone

    # 4. Create the Address ───────────────────────────────────────────────────
    address = Address(
        customer_id=customer.id,
        street=body.address.street,
        city=body.address.city,
        state=body.address.state,
        zip=body.address.zip,
        property_year_built=body.address.property_year_built,
    )
    db.add(address)
    await db.flush()  # get address.id

    # 5. Determine scheduled window times ────────────────────────────────────
    window_start, window_end = _WINDOW_TIMES[body.scheduled_window]

    # 6. Find the first active pro & generate an accept token ─────────────────
    # Sprint 5: single-pro prototype — the matching algorithm comes later.
    pro_result = await db.execute(
        select(Pro).where(Pro.status == ProStatusEnum.active).limit(1)
    )
    pro = pro_result.scalar_one_or_none()
    accept_token = secrets.token_urlsafe(32) if pro else None

    # Load job code for the SMS message (service name)
    jc_result = await db.execute(
        select(JobCode).where(JobCode.id == session.classified_job_code_id)
    )
    job_code_row = jc_result.scalar_one()

    # 7. Create the Job ───────────────────────────────────────────────────────
    job = Job(
        customer_id=customer.id,
        address_id=address.id,
        scoping_session_id=session.id,
        job_code_id=session.classified_job_code_id,
        quoted_price_cents=quoted_price_cents,
        scheduled_date=body.scheduled_date,
        scheduled_window_start=window_start,
        scheduled_window_end=window_end,
        status=JobStatusEnum.pending_pro_accept,
        pro_accept_token=accept_token,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # 8. Send SMS to pro (after commit so job.id is available) ────────────────
    if pro and accept_token:
        accept_url = (
            f"{settings.FRONTEND_URL}/pro/jobs/{job.id}?token={accept_token}"
        )
        send_sms(
            to=pro.phone,
            body=pro_job_offer(
                service_name=job_code_row.name,
                city=body.address.city,
                price_dollars=quoted_price_cents // 100,
                accept_url=accept_url,
            ),
            settings=settings,
        )

    # 9. Return the response ──────────────────────────────────────────────────
    # client_secret and stripe_customer_id are populated in Sprint 4 (Stripe).
    return BookingResponse(
        job_id=str(job.id),
        customer_id=str(customer.id),
        client_secret="",
        stripe_customer_id="",
        quoted_price_cents=quoted_price_cents,
    )
