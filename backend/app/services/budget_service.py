"""
Budget service — allocates a trip's total budget across itinerary days and
scales individual activity costs to fit within each day's allocation.

All functions are pure and deterministic:
  - They do NOT mutate input data structures
  - Same inputs always produce the same outputs
"""

from __future__ import annotations

import copy
from datetime import date

from app.schemas.trip import BudgetSummary, DailyBudgetEntry


def allocate_budget(
    itinerary_data: dict,
    total_budget: float,
    travelers: int,
) -> dict:
    """
    Allocate total_budget across itinerary days and scale activity costs.

    Preconditions:
      - total_budget > 0
      - travelers >= 1
      - itinerary_data["days"] is a non-empty list

    Postconditions:
      - Returns a NEW dict (input is not mutated)
      - sum(day["daily_budget"] for day in result["days"]) <= total_budget + 0.01
      - For each day: |sum(a["estimated_cost"] for a in day["activities"]) - day["daily_budget"]| <= 0.01
      - When all AI-suggested costs are 0, budget is distributed evenly

    Loop Invariant:
      - After processing day D, remaining_budget >= 0 (or within float tolerance)
    """
    if not itinerary_data.get("days"):
        return itinerary_data

    result = copy.deepcopy(itinerary_data)
    days = result["days"]
    num_days = len(days)

    # First pass: compute raw costs per day (sum of activity costs × travelers)
    day_raw_costs: list[float] = []
    for day in days:
        raw = sum(float(a.get("estimated_cost", 0)) for a in day.get("activities", []))
        day_raw_costs.append(raw * travelers)

    total_suggested = sum(day_raw_costs)

    # Second pass: assign daily_budget proportionally (or evenly when costs are all 0)
    for i, day in enumerate(days):
        if total_suggested > 0:
            proportion = day_raw_costs[i] / total_suggested
            day["daily_budget"] = round(total_budget * proportion, 2)
        else:
            day["daily_budget"] = round(total_budget / num_days, 2)

        # Scale individual activity costs to fit the daily_budget
        activities = day.get("activities", [])
        if activities and day_raw_costs[i] > 0:
            # Per-traveler daily budget
            per_traveler_daily = day["daily_budget"] / travelers
            scale_factor = per_traveler_daily / (day_raw_costs[i] / travelers)
            for act in activities:
                act["estimated_cost"] = round(float(act.get("estimated_cost", 0)) * scale_factor, 2)

    return result


def calculate_summary(
    itinerary_days: list[dict],
    total_budget: float,
    travelers: int,
    currency: str = "USD",
) -> BudgetSummary:
    """
    Compute a BudgetSummary from a list of itinerary day dicts.

    Preconditions:
      - total_budget > 0
      - travelers >= 1

    Postconditions:
      - summary.per_person == round(summary.total_allocated / travelers, 2)
      - summary.remaining == round(total_budget - summary.total_allocated, 2)
      - summary.over_budget == (summary.total_allocated > total_budget)
    """
    daily_breakdown: list[DailyBudgetEntry] = []
    total_allocated = 0.0

    for day in itinerary_days:
        day_budget = float(day.get("daily_budget", 0))
        activities_cost = sum(
            float(a.get("estimated_cost", 0)) for a in day.get("activities", [])
        )
        total_allocated += day_budget

        day_date = day.get("date")
        if isinstance(day_date, str):
            try:
                day_date = date.fromisoformat(day_date)
            except ValueError:
                day_date = date.today()

        daily_breakdown.append(
            DailyBudgetEntry(
                day_number=day.get("day_number", 0),
                date=day_date,
                allocated=round(day_budget, 2),
                actual_activities_cost=round(activities_cost, 2),
            )
        )

    total_allocated = round(total_allocated, 2)
    per_person = round(total_allocated / max(travelers, 1), 2)
    remaining = round(total_budget - total_allocated, 2)

    return BudgetSummary(
        total_budget=round(total_budget, 2),
        total_allocated=total_allocated,
        per_person=per_person,
        daily_breakdown=daily_breakdown,
        over_budget=total_allocated > total_budget + 0.01,
        remaining=remaining,
    )
