"""Unit tests for budget_service."""
import pytest
from app.services.budget_service import allocate_budget, calculate_summary


def _make_day(n, activities):
    return {
        "day_number": n,
        "date": f"2024-06-0{n}",
        "theme": f"Day {n}",
        "activities": [{"name": f"Act {i}", "estimated_cost": c} for i, c in enumerate(activities)],
        "daily_budget": 0,
    }


def test_allocate_budget_sum_does_not_exceed_total():
    data = {"days": [_make_day(1, [50, 30]), _make_day(2, [20])]}
    result = allocate_budget(data, 500.0, 2)
    total = sum(d["daily_budget"] for d in result["days"])
    assert total <= 500.01


def test_allocate_budget_does_not_mutate_input():
    data = {"days": [_make_day(1, [100.0])]}
    original_cost = data["days"][0]["activities"][0]["estimated_cost"]
    allocate_budget(data, 200.0, 1)
    assert data["days"][0]["activities"][0]["estimated_cost"] == original_cost


def test_allocate_budget_zero_costs_distributes_evenly():
    data = {"days": [_make_day(1, [0.0]), _make_day(2, [0.0]), _make_day(3, [0.0])]}
    result = allocate_budget(data, 300.0, 1)
    budgets = [d["daily_budget"] for d in result["days"]]
    assert abs(budgets[0] - budgets[1]) < 0.02
    assert abs(budgets[1] - budgets[2]) < 0.02


def test_calculate_summary_per_person():
    days = [{"day_number": 1, "date": "2024-06-01", "daily_budget": 200.0, "activities": []}]
    summary = calculate_summary(days, 300.0, 2)
    assert summary.per_person == 100.0


def test_calculate_summary_remaining():
    days = [{"day_number": 1, "date": "2024-06-01", "daily_budget": 150.0, "activities": []}]
    summary = calculate_summary(days, 300.0, 1)
    assert summary.remaining == 150.0


def test_calculate_summary_over_budget():
    days = [{"day_number": 1, "date": "2024-06-01", "daily_budget": 400.0, "activities": []}]
    summary = calculate_summary(days, 300.0, 1)
    assert summary.over_budget is True
