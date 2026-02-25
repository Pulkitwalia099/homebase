"""
sms/templates.py — SMS message templates.

Keep messages short (under 160 chars when possible) so they arrive as a single
SMS segment rather than being split into multiple messages.
"""


def pro_job_offer(
    service_name: str,
    city: str,
    price_dollars: int,
    accept_url: str,
) -> str:
    """
    Sent to the pro when a new job is available.

    Example:
        "HomeBase: New job — Faucet Leak Repair in Austin.
         Guaranteed $165. Review & accept: https://..."
    """
    return (
        f"HomeBase: New job — {service_name} in {city}. "
        f"Guaranteed ${price_dollars}. "
        f"Review & accept: {accept_url}"
    )


def customer_job_confirmed(
    pro_name: str,
    scheduled_date: str,
    scheduled_window: str,
) -> str:
    """
    Sent to the customer when their pro accepts the job.

    Example:
        "HomeBase: Your plumber is confirmed! Mike R. will arrive
         2026-03-01 between 8am – 12pm. You'll get a reminder the morning of."
    """
    return (
        f"HomeBase: Your plumber is confirmed! "
        f"{pro_name} will arrive {scheduled_date} between {scheduled_window}. "
        f"You'll get a reminder the morning of."
    )
