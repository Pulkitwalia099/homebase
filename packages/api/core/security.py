"""
Security utilities:
- HMAC tokens for pro job-card links (stateless, expires after 48h)
- JWT tokens for customers (issued after booking, for status viewing)
"""
import hashlib
import hmac
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from .config import get_settings

settings = get_settings()

# ──────────────────────────────────────────────
# Pro HMAC tokens (embedded in SMS links)
# ──────────────────────────────────────────────

HMAC_TOKEN_TTL_SECONDS = 48 * 60 * 60  # 48 hours


def generate_pro_token(job_id: str, pro_id: str) -> str:
    """Generate a time-limited HMAC token for a pro to accept a job via SMS link."""
    expires_at = int(time.time()) + HMAC_TOKEN_TTL_SECONDS
    message = f"{job_id}:{pro_id}:{expires_at}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(), message.encode(), hashlib.sha256
    ).hexdigest()
    return f"{expires_at}:{signature}"


def verify_pro_token(token: str, job_id: str, pro_id: str) -> bool:
    """Verify a pro token. Returns True if valid and not expired."""
    try:
        parts = token.split(":", 1)
        if len(parts) != 2:
            return False
        expires_at, signature = parts
        if int(time.time()) > int(expires_at):
            return False
        message = f"{job_id}:{pro_id}:{expires_at}"
        expected = hmac.new(
            settings.SECRET_KEY.encode(), message.encode(), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    except Exception:
        return False


# ──────────────────────────────────────────────
# Customer JWTs (for booking status viewing)
# ──────────────────────────────────────────────

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30


def create_customer_token(customer_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": customer_id, "exp": expire},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_customer_token(token: str) -> Optional[str]:
    """Returns customer_id if valid, None otherwise."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
