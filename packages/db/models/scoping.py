from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum

from .base import Base, TimestampMixin, ChannelEnum, ConfidenceTierEnum, ScopingSessionStatusEnum

if TYPE_CHECKING:
    from .customer import Customer
    from .pricing import JobCode
    from .job import Job


class ScopingSession(Base, TimestampMixin):
    __tablename__ = "scoping_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"))
    channel: Mapped[ChannelEnum] = mapped_column(
        SQLEnum(ChannelEnum, name="channelenum"), nullable=False, default=ChannelEnum.web
    )
    # Full conversation stored as [{role, content}] — Claude's native format
    conversation_history: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    photos: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    classified_job_code_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("job_codes.id"))
    confidence_score: Mapped[Optional[int]] = mapped_column(Integer)  # 0–100
    confidence_tier: Mapped[Optional[ConfidenceTierEnum]] = mapped_column(
        SQLEnum(ConfidenceTierEnum, name="confidencetierenum")
    )
    # Flags detected during conversation: {old_home, accessibility, after_hours, weekend}
    adjustment_flags: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    status: Mapped[ScopingSessionStatusEnum] = mapped_column(
        SQLEnum(ScopingSessionStatusEnum, name="scopingsessionstatusenum"),
        nullable=False,
        default=ScopingSessionStatusEnum.in_progress,
    )

    customer: Mapped[Optional[Customer]] = relationship(back_populates="scoping_sessions")
    classified_job_code: Mapped[Optional[JobCode]] = relationship(back_populates="scoping_sessions")
    job: Mapped[Optional[Job]] = relationship(back_populates="scoping_session", uselist=False)
