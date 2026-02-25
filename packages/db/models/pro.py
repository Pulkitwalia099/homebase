from __future__ import annotations

import uuid
from datetime import date, time
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum

from .base import Base, TimestampMixin, ProStatusEnum

if TYPE_CHECKING:
    from .job import Job


class Pro(Base, TimestampMixin):
    __tablename__ = "pros"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    license_number: Mapped[Optional[str]] = mapped_column(String(100))
    license_type: Mapped[Optional[str]] = mapped_column(String(100))
    insurance_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    background_check_status: Mapped[Optional[str]] = mapped_column(String(50))
    service_radius_miles: Mapped[int] = mapped_column(Integer, default=25)
    avg_rating: Mapped[Optional[float]] = mapped_column(Float)
    total_jobs: Mapped[int] = mapped_column(Integer, default=0)
    jobber_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    jobber_access_token: Mapped[Optional[str]] = mapped_column(Text)
    jobber_refresh_token: Mapped[Optional[str]] = mapped_column(Text)
    stripe_connect_id: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[ProStatusEnum] = mapped_column(
        SQLEnum(ProStatusEnum, name="prostatusenum"), default=ProStatusEnum.active, nullable=False
    )

    availability: Mapped[list[ProAvailability]] = relationship(back_populates="pro")
    jobs: Mapped[list[Job]] = relationship(back_populates="pro")


class ProAvailability(Base):
    __tablename__ = "pro_availability"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pro_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pros.id"), nullable=False)
    day_of_week: Mapped[Optional[int]] = mapped_column(Integer)  # 0=Mon, 6=Sun; NULL if specific_date set
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=True)
    specific_date: Mapped[Optional[date]] = mapped_column(Date)
    blocked: Mapped[bool] = mapped_column(Boolean, default=False)

    pro: Mapped[Pro] = relationship(back_populates="availability")
