import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ──────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────

class JobStatusEnum(str, enum.Enum):
    pending_pro_accept = "pending_pro_accept"
    confirmed = "confirmed"
    en_route = "en_route"
    arrived = "arrived"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ChannelEnum(str, enum.Enum):
    voice = "voice"
    sms = "sms"
    web = "web"


class ConfidenceTierEnum(str, enum.Enum):
    tier1 = "tier1"
    tier2 = "tier2"
    tier3 = "tier3"


class ProStatusEnum(str, enum.Enum):
    active = "active"
    paused = "paused"
    removed = "removed"


class AdjustmentTypeEnum(str, enum.Enum):
    accessibility = "accessibility"
    after_hours = "after_hours"
    old_home = "old_home"
    weekend = "weekend"


class EventSourceEnum(str, enum.Enum):
    pro_sms = "pro_sms"
    jobber_sync = "jobber_sync"
    system = "system"


class ScopeChangeStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    declined = "declined"


class ScopingSessionStatusEnum(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"
