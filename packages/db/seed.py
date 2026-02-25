"""
Seed script — run from packages/db/ directory:
    DATABASE_URL=postgresql+asyncpg://... python seed.py

Seeds:
  - 15 PLM job codes
  - 4 price adjustments (applied to each job code)
  - 1 test pro (Mike's Plumbing)
  - Mon–Fri 8am–5pm availability for the test pro
"""
import asyncio
import os
import uuid
from datetime import time
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


def _clean_db_url(url: str) -> tuple[str, dict]:
    """Strip ssl/sslmode from URL and return (clean_url, connect_args)."""
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    needs_ssl = any(k in qs for k in ("ssl", "sslmode"))
    for key in ("ssl", "sslmode"):
        qs.pop(key, None)
    clean = urlunparse(parsed._replace(query=urlencode(qs, doseq=True)))
    connect_args = {"ssl": "require"} if needs_ssl else {}
    return clean, connect_args

# Add parent dir to path so we can import models
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import (
    Base,
    JobCode,
    PriceAdjustment,
    Pro,
    ProAvailability,
    AdjustmentTypeEnum,
    ProStatusEnum,
)

# ──────────────────────────────────────────────
# Job Code definitions
# ──────────────────────────────────────────────

JOB_CODES = [
    {
        "code": "PLM-001",
        "name": "Faucet Leak Repair",
        "description": "Diagnose and repair a dripping or leaking faucet. Includes replacement of washers, O-rings, or cartridge as needed. Standard parts included.",
        "base_price_cents": 18500,
        "parts_included": True,
        "estimated_duration_min": 60,
        "category": "fixtures",
        "scoping_questions": [
            "Which faucet is leaking — kitchen, bathroom sink, or tub/shower?",
            "Is it dripping from the spout when off, or leaking around the base/handle?",
            "Do you know the faucet brand? (Moen, Delta, Kohler, etc.)",
            "Is the drip constant or does it come and go?",
        ],
    },
    {
        "code": "PLM-002",
        "name": "Toilet Wax Ring Replacement",
        "description": "Remove toilet, replace wax ring seal, and re-set toilet. Resolves leaks at the base of the toilet. New wax ring and hardware included.",
        "base_price_cents": 19500,
        "parts_included": True,
        "estimated_duration_min": 90,
        "category": "toilets",
        "scoping_questions": [
            "Is there water pooling around the base of the toilet?",
            "Do you notice a sewage smell near the toilet?",
            "Has this toilet rocked or moved recently?",
            "When did you first notice the leak?",
        ],
    },
    {
        "code": "PLM-003",
        "name": "Kitchen Drain Cleaning",
        "description": "Clear a clogged kitchen drain using professional-grade equipment. Includes snaking up to 25 feet. Does not include hydro-jetting.",
        "base_price_cents": 16500,
        "parts_included": False,
        "estimated_duration_min": 60,
        "category": "drains",
        "scoping_questions": [
            "Is the drain completely blocked or just draining slowly?",
            "Is it just the kitchen sink or multiple drains in the house?",
            "Did it clog suddenly or get progressively slower?",
            "Have you already tried any drain cleaners or a plunger?",
        ],
    },
    {
        "code": "PLM-004",
        "name": "Bathroom Drain Cleaning",
        "description": "Clear a clogged bathroom sink, tub, or shower drain. Includes snaking and hair removal. Professional equipment used.",
        "base_price_cents": 14500,
        "parts_included": False,
        "estimated_duration_min": 45,
        "category": "drains",
        "scoping_questions": [
            "Which drain is clogged — sink, tub, or shower?",
            "Is there standing water that won't drain at all?",
            "Is the toilet in the same bathroom flushing normally?",
            "Have you noticed a gurgling sound when water drains?",
        ],
    },
    {
        "code": "PLM-005",
        "name": "Toilet Running Constantly",
        "description": "Diagnose and repair a constantly running toilet. Typically involves replacing the fill valve, flapper, or flush valve assembly. Parts included.",
        "base_price_cents": 17500,
        "parts_included": True,
        "estimated_duration_min": 60,
        "category": "toilets",
        "scoping_questions": [
            "Is the toilet running continuously or does it run and then stop?",
            "Do you hear the sound of water trickling inside the tank?",
            "Does jiggling the handle make it stop temporarily?",
            "Has the toilet been flushing weakly or incompletely?",
        ],
    },
    {
        "code": "PLM-006",
        "name": "Water Heater Diagnostic",
        "description": "Diagnose why your water heater isn't performing — no hot water, inconsistent temperature, or strange noises. Includes written diagnostic report. Repair quoted separately.",
        "base_price_cents": 12500,
        "parts_included": False,
        "estimated_duration_min": 60,
        "category": "water_heater",
        "scoping_questions": [
            "Is there no hot water at all, or does it run out quickly?",
            "Is your water heater gas or electric?",
            "Have you noticed any discoloration or odor in the hot water?",
            "How old is the water heater, roughly?",
        ],
    },
    {
        "code": "PLM-007",
        "name": "Water Heater Flush & Maintenance",
        "description": "Flush sediment from water heater tank, check anode rod, inspect for corrosion, test pressure relief valve. Extends water heater life significantly.",
        "base_price_cents": 15500,
        "parts_included": False,
        "estimated_duration_min": 75,
        "category": "water_heater",
        "scoping_questions": [
            "When was the last time the water heater was serviced?",
            "Do you hear popping or rumbling sounds from the water heater?",
            "Is your water heater gas or electric?",
            "What is the approximate age of the unit?",
        ],
    },
    {
        "code": "PLM-008",
        "name": "Garbage Disposal Repair",
        "description": "Diagnose and repair a malfunctioning garbage disposal — includes fixing jams, replacing reset button, or addressing motor issues. Unit replacement quoted separately if needed.",
        "base_price_cents": 16500,
        "parts_included": True,
        "estimated_duration_min": 60,
        "category": "fixtures",
        "scoping_questions": [
            "Is the disposal completely dead, making a humming sound, or making a grinding noise?",
            "Have you already tried pressing the reset button on the bottom?",
            "Is there any water leaking from the disposal?",
            "Did it stop working suddenly or has it been intermittent?",
        ],
    },
    {
        "code": "PLM-009",
        "name": "Pipe Leak Repair — Minor",
        "description": "Repair a visible, accessible pipe leak. Includes copper or PVC pipes under sinks or in accessible walls. Materials for standard repairs up to 6 inches included.",
        "base_price_cents": 22500,
        "parts_included": True,
        "estimated_duration_min": 90,
        "category": "pipes",
        "scoping_questions": [
            "Where is the leak — under a sink, near the water heater, or elsewhere?",
            "Is the leak dripping steadily or spraying?",
            "Have you been able to shut off the water to that area?",
            "Is the pipe exposed (under sink) or inside a wall or ceiling?",
        ],
    },
    {
        "code": "PLM-010",
        "name": "Outdoor Hose Bib Repair",
        "description": "Repair or replace a leaking or stuck outdoor faucet (hose bib / spigot). Includes shutoff valve inspection. Parts included for standard replacement.",
        "base_price_cents": 17500,
        "parts_included": True,
        "estimated_duration_min": 60,
        "category": "fixtures",
        "scoping_questions": [
            "Is the faucet leaking from the spout when off, or from around the handle?",
            "Can you turn the outdoor faucet on and off normally?",
            "Do you know if there's a shutoff valve for this faucet inside the house?",
            "Did this start after a freeze or has it been gradual?",
        ],
    },
    {
        "code": "PLM-011",
        "name": "Toilet Replacement",
        "description": "Remove and haul away existing toilet, supply and install a new standard toilet. Includes new wax ring, supply line, and seat. Standard two-piece toilet included.",
        "base_price_cents": 47500,
        "parts_included": True,
        "estimated_duration_min": 120,
        "category": "toilets",
        "scoping_questions": [
            "Why are you replacing the toilet — cracked, old, or upgrading?",
            "Do you have a specific toilet in mind, or should we supply a standard unit?",
            "Is the toilet on the ground floor or upper floor?",
            "What is the rough-in measurement? (12 inches is standard — do you know yours?)",
        ],
    },
    {
        "code": "PLM-012",
        "name": "Faucet Replacement — Kitchen",
        "description": "Remove existing kitchen faucet and install customer-supplied or standard replacement faucet. Includes all supply line connections and shutoff valve inspection.",
        "base_price_cents": 22500,
        "parts_included": False,
        "estimated_duration_min": 90,
        "category": "fixtures",
        "scoping_questions": [
            "Do you already have the new faucet, or do you need us to supply one?",
            "Is this a single-handle or two-handle faucet currently?",
            "Does your sink have 1, 2, or 3 holes drilled in it?",
            "Is there a sprayer or soap dispenser to reinstall?",
        ],
    },
    {
        "code": "PLM-013",
        "name": "Sewer Line Camera Inspection",
        "description": "Insert a professional camera into the main sewer line to identify blockages, root intrusion, or pipe damage. Includes recorded video and written report.",
        "base_price_cents": 29500,
        "parts_included": False,
        "estimated_duration_min": 90,
        "category": "sewer",
        "scoping_questions": [
            "Are multiple drains in your home backing up or slow?",
            "Have you had recurring clogs in the same drain?",
            "Is there any sewage smell in your basement or yard?",
            "Has there been any recent tree removal or digging near the house?",
        ],
    },
    {
        "code": "PLM-014",
        "name": "Shower Valve Repair",
        "description": "Diagnose and repair a shower valve that won't control temperature, is leaking behind the wall, or is stuck. Includes cartridge replacement if needed. Wall access required.",
        "base_price_cents": 28500,
        "parts_included": True,
        "estimated_duration_min": 120,
        "category": "fixtures",
        "scoping_questions": [
            "Is the issue that you can't control the temperature, or is it leaking?",
            "Is there a wall access panel behind the shower valve?",
            "Do you know the brand of the shower fixture (Moen, Delta, Kohler)?",
            "Is the shower leaking into a wall, ceiling, or another room?",
        ],
    },
    {
        "code": "PLM-015",
        "name": "Main Water Shutoff Valve Replacement",
        "description": "Replace the main shutoff valve for the house. Requires temporary water shutoff at the meter. Critical for homes with old gate valves that no longer seal fully.",
        "base_price_cents": 38500,
        "parts_included": True,
        "estimated_duration_min": 120,
        "category": "pipes",
        "scoping_questions": [
            "Is the valve leaking, or does it just not shut off the water completely?",
            "Do you know if it's a ball valve (lever handle) or gate valve (round wheel handle)?",
            "When was the last time someone turned it fully off and back on?",
            "Is this the interior shutoff near the meter, or the exterior curb stop?",
        ],
    },
]

# Price adjustments — one set applies to ALL job codes
PRICE_ADJUSTMENTS = [
    {
        "adjustment_type": AdjustmentTypeEnum.old_home,
        "multiplier": 1.25,
        "flat_add_cents": None,
        "description": "Pre-1970 home — older pipes and fittings require more time and care",
    },
    {
        "adjustment_type": AdjustmentTypeEnum.accessibility,
        "multiplier": None,
        "flat_add_cents": 4500,
        "description": "Difficult access — crawlspace, no local shutoff, or limited workspace",
    },
    {
        "adjustment_type": AdjustmentTypeEnum.after_hours,
        "multiplier": None,
        "flat_add_cents": 7500,
        "description": "After-hours service — before 8am or after 5pm weekdays",
    },
    {
        "adjustment_type": AdjustmentTypeEnum.weekend,
        "multiplier": None,
        "flat_add_cents": 6500,
        "description": "Weekend service — Saturday or Sunday",
    },
]

# ──────────────────────────────────────────────
# Seed logic
# ──────────────────────────────────────────────

async def seed():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")

    clean_url, connect_args = _clean_db_url(database_url)
    engine = create_async_engine(clean_url, echo=False, connect_args=connect_args)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        print("Seeding job codes...")
        job_code_objects = []
        for jc_data in JOB_CODES:
            jc = JobCode(**jc_data)
            session.add(jc)
            job_code_objects.append(jc)
        await session.flush()  # Get IDs before creating adjustments

        print("Seeding price adjustments...")
        for jc in job_code_objects:
            for adj_data in PRICE_ADJUSTMENTS:
                adj = PriceAdjustment(job_code_id=jc.id, **adj_data)
                session.add(adj)

        print("Seeding test pro...")
        test_pro = Pro(
            name="Mike's Plumbing",
            phone="+18572506452",
            email="mike@mikesplumbing.test",
            license_number="TX-PLM-88421",
            license_type="Master Plumber",
            insurance_verified=True,
            background_check_status="passed",
            service_radius_miles=30,
            avg_rating=4.8,
            total_jobs=0,
            status=ProStatusEnum.active,
        )
        session.add(test_pro)
        await session.flush()

        print("Seeding pro availability (Mon–Fri 8am–5pm)...")
        for day in range(5):  # 0=Mon through 4=Fri
            avail = ProAvailability(
                pro_id=test_pro.id,
                day_of_week=day,
                start_time=time(8, 0),
                end_time=time(17, 0),
                is_recurring=True,
                blocked=False,
            )
            session.add(avail)

        await session.commit()
        print(f"✓ Seeded {len(JOB_CODES)} job codes with {len(JOB_CODES) * len(PRICE_ADJUSTMENTS)} price adjustments")
        print(f"✓ Seeded test pro: {test_pro.name} (phone: {test_pro.phone})")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
