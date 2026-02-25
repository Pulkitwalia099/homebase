from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum

from .base import Base, TimestampMixin, JobStatusEnum, EventSourceEnum, ScopeChangeStatusEnum

if TYPE_CHECKING:
    from .customer import Customer, Address
    from .pro import Pro
    from .scoping import ScopingSession
    from .pricing import JobCode


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    pro_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("pros.id"))
    address_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=False)
    scoping_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("scoping_sessions.id"))
    job_code_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("job_codes.id"), nullable=False)
    quoted_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    final_price_cents: Mapped[Optional[int]] = mapped_column(Integer)
    scheduled_date: Mapped[Optional[date]] = mapped_column(Date)
    scheduled_window_start: Mapped[Optional[time]] = mapped_column(Time)
    scheduled_window_end: Mapped[Optional[time]] = mapped_column(Time)
    status: Mapped[JobStatusEnum] = mapped_column(
        SQLEnum(JobStatusEnum, name="jobstatusenum"),
        nullable=False,
        default=JobStatusEnum.pending_pro_accept,
    )
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(String(255))
    stripe_payment_method_id: Mapped[Optional[str]] = mapped_column(String(255))
    booking_fee_charged: Mapped[bool] = mapped_column(Boolean, default=False)
    booking_fee_cents: Mapped[Optional[int]] = mapped_column(Integer)
    pro_accept_token: Mapped[Optional[str]] = mapped_column(String(255))
    pro_notes: Mapped[Optional[str]] = mapped_column(Text)
    customer_rating: Mapped[Optional[int]] = mapped_column(Integer)
    customer_review: Mapped[Optional[str]] = mapped_column(Text)
    scope_change_approved: Mapped[bool] = mapped_column(Boolean, default=False)

    customer: Mapped[Customer] = relationship(back_populates="jobs")
    pro: Mapped[Optional[Pro]] = relationship(back_populates="jobs")
    address: Mapped[Address] = relationship(back_populates="jobs")
    scoping_session: Mapped[Optional[ScopingSession]] = relationship(back_populates="job")
    job_code: Mapped[JobCode] = relationship(back_populates="jobs")
    scope_changes: Mapped[list[ScopeChange]] = relationship(back_populates="job")
    status_events: Mapped[list[JobStatusEvent]] = relationship(
        back_populates="job", order_by="JobStatusEvent.timestamp"
    )


class ScopeChange(Base, TimestampMixin):
    __tablename__ = "scope_changes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    pro_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pros.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    photos: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    original_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    revised_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ScopeChangeStatusEnum] = mapped_column(
        SQLEnum(ScopeChangeStatusEnum, name="scopechangestatusenum"),
        nullable=False,
        default=ScopeChangeStatusEnum.pending,
    )

    job: Mapped[Job] = relationship(back_populates="scope_changes")


class JobStatusEvent(Base):
    __tablename__ = "job_status_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    source: Mapped[EventSourceEnum] = mapped_column(
        SQLEnum(EventSourceEnum, name="eventsourceenum"), nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Note: "metadata" is reserved by SQLAlchemy — we use "event_metadata" as the Python attribute
    # but store it in a column called "metadata" in the database
    event_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSONB)

    job: Mapped[Job] = relationship(back_populates="status_events")
