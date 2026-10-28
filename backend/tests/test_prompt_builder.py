"""Unit tests for prompt_builder."""
import pytest
from datetime import date
from app.services.prompt_builder import build_itinerary_prompt
from app.schemas.trip import TripCreate


def _make_trip(**kwargs):
    defaults = dict(
        destination="Paris",
        start_date=date(2024, 6, 1),
        end_date=date(2024, 6, 3),
        budget_amount=1500.0,
        budget_currency="USD",
        travelers_count=2,
        traveler_type="couple",
        travel_pace="moderate",
        interests=["food", "history"],
        accommodation_pref="hotel",
        dietary_preferences=["vegetarian"],
        accessibility_needs=[],
    )
    defaults.update(kwargs)
    return TripCreate(**defaults)


def test_prompt_contains_destination():
    trip = _make_trip(destination="Tokyo")
    prompt = build_itinerary_prompt(trip, 3)
    assert "Tokyo" in prompt


def test_prompt_contains_all_required_fields():
    trip = _make_trip()
    prompt = build_itinerary_prompt(trip, 3)
    for field in ["Paris", "couple", "moderate", "1500", "2", "food", "history",
                  "hotel", "vegetarian"]:
        assert field in prompt, f"Missing field in prompt: {field}"


def test_prompt_contains_day_count():
    trip = _make_trip()
    prompt = build_itinerary_prompt(trip, 5)
    assert "5" in prompt


def test_prompt_contains_dates():
    trip = _make_trip()
    prompt = build_itinerary_prompt(trip, 3)
    assert "2024-06-01" in prompt
    assert "2024-06-03" in prompt
