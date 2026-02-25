from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum

from .base import Base, AdjustmentTypeEnum

if TYPE_CHECKING:
    from .scoping import ScopingSession
    from .job import Job


class JobCode(Base):
    __tablename__ = "job_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    base_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    parts_included: Mapped[bool] = mapped_column(Boolean, default=False)
    estimated_duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    scoping_questions: Mapped[Optional[list]] = mapped_column(JSONB)

    price_adjustments: Mapped[list[PriceAdjustment]] = relationship(back_populates="job_code")
    scoping_sessions: Mapped[list[ScopingSession]] = relationship(back_populates="classified_job_code")
    jobs: Mapped[list[Job]] = relationship(back_populates="job_code")


class PriceAdjustment(Base):
    __tablename__ = "price_adjustments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_code_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("job_codes.id"), nullable=False)
    adjustment_type: Mapped[AdjustmentTypeEnum] = mapped_column(
        SQLEnum(AdjustmentTypeEnum, name="adjustmenttypeenum"), nullable=False
    )
    multiplier: Mapped[Optional[float]] = mapped_column(Float)
    flat_add_cents: Mapped[Optional[int]] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    job_code: Mapped[JobCode] = relationship(back_populates="price_adjustments")
