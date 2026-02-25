import asyncio
import os
import sys
from logging.config import fileConfig
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Add packages/db/ to Python path so `from models import Base` works
# no matter where alembic is invoked from
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Load all models so Alembic can detect them for autogenerate
from models import Base  # noqa: F401 — must import to register all tables

# Alembic Config object
config = context.config

# Read the DATABASE_URL from environment (set in .env or Railway env vars)
database_url = os.environ.get("DATABASE_URL", "")

# asyncpg doesn't accept ?ssl=true or ?sslmode=require as URL query params —
# it needs SSL passed via connect_args. Strip any ssl/sslmode params from the
# URL and track whether SSL is needed so we can pass it separately.
_needs_ssl = False
if database_url:
    parsed = urlparse(database_url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    # Remove ssl-related params and remember we need SSL
    for key in ("ssl", "sslmode"):
        if key in qs:
            _needs_ssl = True
            del qs[key]
    clean_url = urlunparse(parsed._replace(query=urlencode(qs, doseq=True)))
    config.set_main_option("sqlalchemy.url", clean_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without a live DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode using an async engine."""
    # Build connect_args — pass SSL when connecting to Supabase/cloud PG.
    # Use ssl='require' (string) instead of a full SSL context: this tells asyncpg
    # to encrypt the connection without verifying the certificate chain, which is
    # needed for Supabase's connection pooler (Supavisor uses a self-signed cert).
    connect_args: dict = {}
    if _needs_ssl:
        connect_args["ssl"] = "require"
    # Supabase's transaction pooler (Supavisor) doesn't support prepared statements.
    # Setting this to 0 disables them so asyncpg sends plain queries instead.
    connect_args["statement_cache_size"] = 0

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
