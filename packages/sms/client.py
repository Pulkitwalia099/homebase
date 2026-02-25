"""
sms/client.py — Thin Twilio wrapper.

Usage:
    from sms.client import send_sms
    send_sms(to="+15551234567", body="Your job is confirmed!", settings=get_settings())

If Twilio credentials are still placeholders (not configured), the message is
printed to the console so you can test the full flow without a real Twilio account.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.config import Settings


def send_sms(to: str, body: str, settings: "Settings") -> None:
    """
    Send an SMS via Twilio.

    Always prints the message to the console (useful for local dev — copy the
    URL to test the pro job card flow without a real phone).
    Also sends via Twilio when credentials are configured and valid.
    """
    # Always log — makes it easy to grab the accept URL during local testing.
    print(
        f"\n{'─'*60}\n"
        f"📱 SMS\n"
        f"To:   {to}\n"
        f"Body: {body}\n"
        f"{'─'*60}\n"
    )

    if not settings.twilio_configured:
        return

    # Import lazily so the server starts fine even if twilio isn't installed yet.
    from twilio.rest import Client  # type: ignore[import]

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(
        body=body,
        from_=settings.TWILIO_FROM_NUMBER,
        to=to,
    )
