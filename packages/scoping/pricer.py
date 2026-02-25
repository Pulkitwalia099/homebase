"""
pricer.py — Calculates the final quoted price for a classified job.

Takes a job_code row's UUID and the adjustment_flags dict from the classification,
then looks up all applicable PriceAdjustments in the database and applies them.

Price calculation order (matters when both types exist):
  1. Apply multipliers first  (e.g., old_home ×1.25 on the base price)
  2. Apply flat adds second   (e.g., +$45 accessibility, +$75 after_hours, +$65 weekend)
"""

from __future__ import annotations

import math
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# These model imports work because packages/ is on sys.path (set in main.py)
from db.models.pricing import JobCode, PriceAdjustment


async def calculate_quote(
    db: AsyncSession,
    job_code_id: UUID,
    adjustment_flags: dict,
) -> dict:
    """
    Calculate the final quoted price for a job.

    Args:
        db:               An active async database session.
        job_code_id:      The UUID of the classified JobCode row.
        adjustment_flags: Dict from the classifier, e.g.
                          {"old_home": True, "accessibility": False, ...}

    Returns a dict with:
        job_code          str   — e.g. "PLM-001"
        job_name          str   — e.g. "Faucet Leak Repair"
        base_price_cents  int   — before adjustments
        final_price_cents int   — after adjustments (rounded up to nearest cent)
        adjustments_applied list[str] — human-readable list of applied adjustments
        estimated_duration_min int
        confidence_tier   str   — passed through from engine (not calculated here)
    """
    # 1. Load the JobCode row
    result = await db.execute(select(JobCode).where(JobCode.id == job_code_id))
    job_code_row = result.scalar_one()  # raises if not found — caller ensures it exists

    base = job_code_row.base_price_cents

    # 2. Load all PriceAdjustment rows for this job code
    adj_result = await db.execute(
        select(PriceAdjustment).where(PriceAdjustment.job_code_id == job_code_id)
    )
    all_adjustments = adj_result.scalars().all()

    # 3. Build a lookup: adjustment_type (str) → PriceAdjustment row
    adj_by_type: dict[str, PriceAdjustment] = {
        a.adjustment_type.value: a for a in all_adjustments
    }

    # 4. Apply multipliers first (affects the running total before flat adds)
    running_price = float(base)
    applied: list[str] = []
    # price_breakdown: first entry is always the base service; adjustments added below
    price_breakdown: list[dict] = [{"label": job_code_row.name, "amount_cents": base}]

    multiplier_flags = ["old_home"]  # only old_home is a multiplier in current data
    for flag_name in multiplier_flags:
        if adjustment_flags.get(flag_name) and flag_name in adj_by_type:
            adj = adj_by_type[flag_name]
            if adj.multiplier is not None:
                new_price = running_price * adj.multiplier
                delta = math.ceil(new_price - running_price)
                running_price = new_price
                applied.append(adj.description)
                price_breakdown.append({"label": adj.description, "amount_cents": delta})

    # 5. Apply flat additions
    flat_flags = ["accessibility", "after_hours", "weekend"]
    for flag_name in flat_flags:
        if adjustment_flags.get(flag_name) and flag_name in adj_by_type:
            adj = adj_by_type[flag_name]
            if adj.flat_add_cents is not None:
                running_price += adj.flat_add_cents
                applied.append(adj.description)
                price_breakdown.append({"label": adj.description, "amount_cents": adj.flat_add_cents})

    final_price_cents = math.ceil(running_price)

    return {
        "job_code": job_code_row.code,
        "job_name": job_code_row.name,
        "base_price_cents": base,
        "final_price_cents": final_price_cents,
        "adjustments_applied": applied,
        "price_breakdown": price_breakdown,
        "estimated_duration_min": job_code_row.estimated_duration_min,
    }
