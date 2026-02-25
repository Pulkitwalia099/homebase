from typing import AsyncGenerator
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import get_settings

settings = get_settings()


def _build_engine_args(url: str) -> tuple[str, dict]:
    """Strip ssl/sslmode query params from URL and return (clean_url, connect_args).

    asyncpg doesn't accept sslmode as a URL query parameter — it needs to be
    passed via connect_args. This helper handles that translation.
    """
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    needs_ssl = any(k in qs for k in ("ssl", "sslmode"))
    for key in ("ssl", "sslmode"):
        qs.pop(key, None)
    clean_url = urlunparse(parsed._replace(query=urlencode(qs, doseq=True)))
    connect_args = {"ssl": "require"} if needs_ssl else {}
    return clean_url, connect_args


_db_url, _connect_args = _build_engine_args(settings.DATABASE_URL)

# Create the async engine
# pool_size and max_overflow tuned for Railway free tier
engine = create_async_engine(
    _db_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Verifies connections before using them
    echo=settings.ENVIRONMENT == "development",
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
