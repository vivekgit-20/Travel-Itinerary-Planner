"""
Optimization service — groups itinerary activities by neighborhood and
reassigns non-overlapping time slots to minimize travel within each day.

All functions are deterministic: same input always produces same output.
"""

from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any


# ─── Neighborhood extraction ──────────────────────────────────────────────────

# Common location suffixes that often appear after the neighborhood name
_STRIP_SUFFIXES = re.compile(
    r",?\s+(street|st|avenue|ave|road|rd|blvd|boulevard|square|sq|park|district|quarter|area|center|centre)\b.*$",
    re.IGNORECASE,
)

_KNOWN_DISTRICTS = {
    "old town", "city center", "downtown", "new town", "market district",
    "cultural district", "arts district", "restaurant row", "park district",
    "museum quarter", "old city", "waterfront", "harbour", "harbor",
}


def extract_neighborhood(location: str) -> str:
    """
    Extract a neighborhood/district label from a location string.

    Preconditions:
      - location is a non-empty string

    Postconditions:
      - Returns a non-empty string (never empty)
      - Output is deterministic for the same input
      - Returns "General" when no recognizable neighborhood can be extracted
    """
    if not location or not location.strip():
        return "General"

    cleaned = location.strip().lower()

    # Check against known district names
    for district in _KNOWN_DISTRICTS:
        if district in cleaned:
            return district.title()

    # Strip trailing street/road suffixes
    cleaned = _STRIP_SUFFIXES.sub("", cleaned).strip()

    # If it looks like a comma-separated address, take the second segment (neighborhood)
    parts = [p.strip() for p in location.split(",") if p.strip()]
    if len(parts) >= 2:
        return parts[-1].strip().title()

    # Return the cleaned location (capitalised) or General
    result = cleaned.title()
    return result if result else "General"


# ─── Time slot management ─────────────────────────────────────────────────────

def _parse_time(hhmm: str) -> datetime:
    """Parse "HH:MM" into a datetime object (date part is irrelevant)."""
    try:
        return datetime.strptime(hhmm, "%H:%M")
    except ValueError:
        return datetime.strptime("09:00", "%H:%M")


def _format_time(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def reassign_time_slots(activities: list[dict], day_start: str = "09:00") -> list[dict]:
    """
    Reassign consecutive non-overlapping time windows to activities.

    Preconditions:
      - activities is a non-empty list of activity dicts with start_time / end_time fields
      - day_start is in "HH:MM" format

    Postconditions:
      - Each activity's duration (end - start) is preserved
      - No two activities overlap
      - A 15-minute travel buffer is inserted when the neighborhood changes
      - Activities are returned in the same order they were received

    Loop Invariant:
      - current_time is always >= the end_time of the previous activity
    """
    if not activities:
        return activities

    current_time = _parse_time(day_start)
    prev_neighborhood = None
    result = []

    for activity in activities:
        original_start = _parse_time(activity.get("start_time", "09:00"))
        original_end = _parse_time(activity.get("end_time", "10:00"))
        duration = original_end - original_start
        # Guard against zero or negative durations
        if duration.total_seconds() <= 0:
            duration = timedelta(hours=1)

        # Insert 15-min travel buffer on neighborhood switch
        neighborhood = activity.get("neighborhood") or extract_neighborhood(activity.get("location", ""))
        if prev_neighborhood is not None and neighborhood != prev_neighborhood:
            current_time += timedelta(minutes=15)

        new_activity = dict(activity)
        new_activity["start_time"] = _format_time(current_time)
        new_activity["end_time"] = _format_time(current_time + duration)
        current_time = current_time + duration

        prev_neighborhood = neighborhood
        result.append(new_activity)

    return result


# ─── Neighborhood grouping ────────────────────────────────────────────────────

def group_by_neighborhood(itinerary_data: dict) -> dict:
    """
    Reorder activities within each day to cluster by neighborhood.

    Preconditions:
      - itinerary_data["days"] is a non-empty list of day dicts
      - Each day has an "activities" list

    Postconditions:
      - Activities within each day are reordered to form neighborhood clusters
      - Total activity count per day is preserved (no adds/removes)
      - Time slots are reassigned to be non-overlapping after reordering
      - Days are returned in their original order

    Loop Invariant:
      - After processing day D, len(days[D]["activities"]) == original count
    """
    result = dict(itinerary_data)
    processed_days = []

    for day in itinerary_data.get("days", []):
        activities = list(day.get("activities", []))
        original_count = len(activities)

        if not activities:
            processed_days.append(day)
            continue

        # Assign neighborhood labels if missing
        for act in activities:
            if not act.get("neighborhood"):
                act["neighborhood"] = extract_neighborhood(act.get("location", ""))

        # Stable-sort by neighborhood (preserves intra-group original order)
        neighborhood_map: dict[str, list[dict]] = defaultdict(list)
        for act in activities:
            neighborhood_map[act["neighborhood"]].append(act)

        # Flatten in sorted neighborhood order
        ordered: list[dict] = []
        for neighborhood in sorted(neighborhood_map.keys()):
            ordered.extend(neighborhood_map[neighborhood])

        assert len(ordered) == original_count, "Activity count must not change during grouping"

        # Reassign time slots
        day_start = ordered[0].get("start_time", "09:00") if ordered else "09:00"
        ordered = reassign_time_slots(ordered, day_start="09:00")

        processed_day = dict(day)
        processed_day["activities"] = ordered
        processed_days.append(processed_day)

    result["days"] = processed_days
    return result
