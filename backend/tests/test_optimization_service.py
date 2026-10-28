"""Unit tests for optimization_service."""
import pytest
from app.services.optimization_service import (
    extract_neighborhood, group_by_neighborhood, reassign_time_slots
)


def _act(name, start="09:00", end="10:00", neighborhood="Old Town", location="Old Town"):
    return {"id": name, "name": name, "start_time": start, "end_time": end,
            "neighborhood": neighborhood, "location": location,
            "estimated_cost": 10.0, "description": "", "currency": "USD", "category": "sightseeing"}


def test_extract_neighborhood_returns_general_for_empty():
    assert extract_neighborhood("") == "General"
    assert extract_neighborhood("   ") == "General"


def test_extract_neighborhood_detects_known_district():
    result = extract_neighborhood("Near the old town market")
    assert "Old Town" in result


def test_extract_neighborhood_is_deterministic():
    loc = "Some location, Central Park"
    assert extract_neighborhood(loc) == extract_neighborhood(loc)


def test_reassign_time_slots_no_overlap():
    acts = [
        _act("A", "09:00", "10:30", "District1"),
        _act("B", "11:00", "12:00", "District2"),
        _act("C", "14:00", "15:00", "District1"),
    ]
    result = reassign_time_slots(acts)
    for i in range(len(result) - 1):
        assert result[i]["end_time"] <= result[i+1]["start_time"]


def test_reassign_time_slots_preserves_duration():
    acts = [_act("A", "09:00", "11:00", "D1")]
    result = reassign_time_slots(acts)
    from datetime import datetime
    s = datetime.strptime(result[0]["start_time"], "%H:%M")
    e = datetime.strptime(result[0]["end_time"], "%H:%M")
    assert (e - s).seconds == 2 * 3600


def test_group_by_neighborhood_preserves_count():
    data = {"days": [{"day_number": 1, "date": "2024-06-01", "theme": "T",
                      "daily_budget": 100, "activities": [
                          _act("A", neighborhood="Z"),
                          _act("B", neighborhood="A"),
                          _act("C", neighborhood="Z"),
                      ]}]}
    result = group_by_neighborhood(data)
    assert len(result["days"][0]["activities"]) == 3


def test_group_by_neighborhood_clusters():
    data = {"days": [{"day_number": 1, "date": "2024-06-01", "theme": "T",
                      "daily_budget": 100, "activities": [
                          _act("A", neighborhood="Zone1"),
                          _act("B", neighborhood="Zone2"),
                          _act("C", neighborhood="Zone1"),
                      ]}]}
    result = group_by_neighborhood(data)
    acts = result["days"][0]["activities"]
    neighborhoods = [a["neighborhood"] for a in acts]
    # Zone1 activities should be contiguous
    zone1_indices = [i for i, n in enumerate(neighborhoods) if n == "Zone1"]
    assert zone1_indices == list(range(zone1_indices[0], zone1_indices[-1] + 1))
