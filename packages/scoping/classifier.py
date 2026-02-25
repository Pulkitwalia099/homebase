"""
classifier.py — Detects and parses the classification JSON that Claude embeds in its responses.

When Claude has enough information, it outputs a JSON block like:
  {"classification": true, "job_code": "PLM-001", "confidence": 85, "reasoning": "...",
   "adjustment_flags": {"old_home": false, "accessibility": false, "after_hours": false, "weekend": false}}

This module finds that block, validates it, and returns it as a Python dict.
"""

from __future__ import annotations

import json


# Required keys that must be present in a valid classification block
_REQUIRED_KEYS = {"job_code", "confidence", "reasoning", "adjustment_flags"}

# All valid PLM job codes — classifier rejects anything not on this list
VALID_JOB_CODES = {
    "PLM-001", "PLM-002", "PLM-003", "PLM-004", "PLM-005",
    "PLM-006", "PLM-007", "PLM-008", "PLM-009", "PLM-010",
    "PLM-011", "PLM-012", "PLM-013", "PLM-014", "PLM-015",
}


def _find_json_objects(text: str) -> list[str]:
    """
    Extract all top-level JSON objects from text using bracket-depth counting.

    This handles nested objects (like adjustment_flags: {...}) that a simple
    regex like {[^{}]*} would miss.
    """
    objects = []
    i = 0
    while i < len(text):
        if text[i] != '{':
            i += 1
            continue
        # Found a potential JSON object start — walk forward tracking depth
        depth = 0
        in_string = False
        escape_next = False
        j = i
        while j < len(text):
            c = text[j]
            if escape_next:
                escape_next = False
            elif c == '\\' and in_string:
                escape_next = True
            elif c == '"':
                in_string = not in_string
            elif not in_string:
                if c == '{':
                    depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0:
                        objects.append(text[i:j + 1])
                        i = j  # outer loop will increment past this
                        break
            j += 1
        i += 1
    return objects


def detect_classification(text: str) -> dict | None:
    """
    Scan Claude's response text for a classification JSON block.

    Returns the parsed dict if a valid classification is found, or None if the
    response doesn't contain a classification yet (meaning Claude wants to ask
    more questions first).

    The JSON must contain "classification": true plus the required keys.
    """
    # Skip the scan entirely if the key signal isn't even present
    if '"classification"' not in text:
        return None

    candidates = _find_json_objects(text)

    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue

        # Must explicitly be true (not just truthy)
        if data.get("classification") is not True:
            continue

        # Must have all required keys
        if not _REQUIRED_KEYS.issubset(data.keys()):
            continue

        # job_code must be one of our known codes
        if data.get("job_code") not in VALID_JOB_CODES:
            continue

        # confidence must be an int between 0 and 100
        confidence = data.get("confidence")
        if not isinstance(confidence, int) or not (0 <= confidence <= 100):
            continue

        # adjustment_flags must be a dict with the 4 expected keys
        flags = data.get("adjustment_flags", {})
        if not isinstance(flags, dict):
            continue
        expected_flags = {"old_home", "accessibility", "after_hours", "weekend"}
        if not expected_flags.issubset(flags.keys()):
            continue

        return data

    return None


def get_confidence_tier(confidence: int) -> str:
    """
    Convert a numeric confidence score into a named tier.

    Tier 1 (≥75): Strong match — show quote immediately.
    Tier 2 (50–74): Decent match — show quote with a note.
    Tier 3 (<50): Weak match — should not normally happen (engine asks more questions first).
    """
    if confidence >= 75:
        return "tier1"
    elif confidence >= 50:
        return "tier2"
    else:
        return "tier3"
