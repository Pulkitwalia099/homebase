from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database (required from Sprint 0) ─────
    DATABASE_URL: str

    # ── Anthropic (required from Sprint 1) ────
    ANTHROPIC_API_KEY: str

    # ── Twilio (required from Sprint 5) ───────
    # Default placeholders so server starts during Sprints 0-4
    TWILIO_ACCOUNT_SID: str = "placeholder"
    TWILIO_AUTH_TOKEN: str = "placeholder"
    TWILIO_FROM_NUMBER: str = "+15550000000"

    # ── Stripe (required from Sprint 4) ───────
    STRIPE_SECRET_KEY: str = "sk_test_placeholder"
    STRIPE_WEBHOOK_SECRET: str = "whsec_placeholder"
    STRIPE_BOOKING_FEE_CENTS: int = 3500

    # ── App ───────────────────────────────────
    SECRET_KEY: str
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    INTERNAL_API_KEY: str

    # ── Supabase Storage ──────────────────────
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_STORAGE_BUCKET: str = "job-photos"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def twilio_configured(self) -> bool:
        """True only when real Twilio credentials are in .env."""
        return (
            self.TWILIO_ACCOUNT_SID != "placeholder"
            and self.TWILIO_AUTH_TOKEN != "placeholder"
        )

    @property
    def stripe_configured(self) -> bool:
        """True only when real Stripe credentials are in .env."""
        return self.STRIPE_SECRET_KEY != "sk_test_placeholder"


@lru_cache
def get_settings() -> Settings:
    """Cached settings — reads env vars once at startup."""
    return Settings()
