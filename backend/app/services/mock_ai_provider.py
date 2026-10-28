"""
Deterministic mock AI provider for development and testing.

Returns a valid, hard-coded itinerary JSON that matches ITINERARY_JSON_SCHEMA
without making any external API calls.

Used when USE_MOCK_AI=true (the default for local dev).
All data is clearly labeled as [DEMO] content.
"""

from __future__ import annotations

from typing import Optional

import copy
from datetime import date, timedelta


_ACTIVITY_TEMPLATES = [
    {
        "name": "{destination} City Walking Tour",
        "description": "[DEMO] A guided walk through the historic city center covering major landmarks.",
        "location": "City Center",
        "neighborhood": "Old Town",
        "start_time": "09:00",
        "end_time": "11:30",
        "estimated_cost": 25.0,
        "currency": "USD",
        "category": "sightseeing",
        "practical_notes": "[DEMO] Book in advance. Wear comfortable shoes.",
        "why_recommended": "Perfect orientation activity covering the main highlights.",
    },
    {
        "name": "Local Street Food Market",
        "description": "[DEMO] Explore the vibrant street food market with local specialties.",
        "location": "Central Market",
        "neighborhood": "Market District",
        "start_time": "12:00",
        "end_time": "13:30",
        "estimated_cost": 15.0,
        "currency": "USD",
        "category": "food",
        "practical_notes": "[DEMO] Cash preferred at most stalls.",
        "why_recommended": "Immersive food experience matching culinary interests.",
    },
    {
        "name": "{destination} National Museum",
        "description": "[DEMO] Discover the rich history and culture through extensive collections.",
        "location": "Museum Quarter",
        "neighborhood": "Cultural District",
        "start_time": "14:00",
        "end_time": "17:00",
        "estimated_cost": 20.0,
        "currency": "USD",
        "category": "culture",
        "practical_notes": "[DEMO] Closed on Mondays. Audio guides available.",
        "why_recommended": "Deep dive into local history and culture.",
    },
    {
        "name": "Rooftop Sunset Dinner",
        "description": "[DEMO] Panoramic city views with locally-sourced cuisine.",
        "location": "Downtown",
        "neighborhood": "Restaurant Row",
        "start_time": "19:00",
        "end_time": "21:30",
        "estimated_cost": 45.0,
        "currency": "USD",
        "category": "food",
        "practical_notes": "[DEMO] Reservation strongly recommended.",
        "why_recommended": "Memorable dining with spectacular views.",
    },
    {
        "name": "Adventure Nature Trek",
        "description": "[DEMO] Half-day guided trek through scenic natural landscapes.",
        "location": "Nature Reserve",
        "neighborhood": "Park District",
        "start_time": "08:00",
        "end_time": "12:00",
        "estimated_cost": 35.0,
        "currency": "USD",
        "category": "adventure",
        "practical_notes": "[DEMO] Bring water, sunscreen, and good walking shoes.",
        "why_recommended": "Outdoor adventure connecting with local natural beauty.",
    },
    {
        "name": "Artisan Workshop & Craft Fair",
        "description": "[DEMO] Visit local artisan workshops and browse handmade goods.",
        "location": "Arts Quarter",
        "neighborhood": "Arts District",
        "start_time": "10:00",
        "end_time": "13:00",
        "estimated_cost": 10.0,
        "currency": "USD",
        "category": "local-experience",
        "practical_notes": "[DEMO] Free entry. Purchases optional.",
        "why_recommended": "Authentic local cultural experience.",
    },
]

_DAY_THEMES = [
    "Arrival & City Orientation",
    "Historical Landmarks & Culture",
    "Nature, Adventure & Local Cuisine",
    "Art, Shopping & Evening Entertainment",
    "Hidden Gems & Authentic Local Life",
    "Relaxation, Spa & Scenic Views",
    "Day Trip & Regional Exploration",
]


def _make_activities(destination: str, day_number: int, num_activities: int = 4) -> list[dict]:
    activities = []
    base_idx = (day_number - 1) * 2
    for i in range(num_activities):
        tmpl = copy.deepcopy(_ACTIVITY_TEMPLATES[(base_idx + i) % len(_ACTIVITY_TEMPLATES)])
        tmpl["id"] = f"act_{day_number:02d}_{i+1:02d}"
        tmpl["name"] = tmpl["name"].format(destination=destination)
        activities.append(tmpl)
    return activities


def generate_mock_itinerary(
    destination: str,
    start_date: date,
    duration_days: int,
    total_budget: float,
    currency: str = "USD",
) -> dict:
    """
    Generate a deterministic mock itinerary.
    Returns a dict matching ITINERARY_JSON_SCHEMA.
    """
    daily_budget = round(total_budget / duration_days, 2)
    days = []

    for day_num in range(1, duration_days + 1):
        day_date = start_date + timedelta(days=day_num - 1)
        theme_idx = (day_num - 1) % len(_DAY_THEMES)
        activities = _make_activities(destination, day_num, num_activities=4 if day_num % 2 == 0 else 3)

        days.append({
            "day_number": day_num,
            "date": day_date.isoformat(),
            "theme": f"[DEMO] {_DAY_THEMES[theme_idx]}",
            "activities": activities,
            "daily_budget": daily_budget,
            "transportation_note": f"[DEMO] Day {day_num}: Use public transit between neighborhoods.",
        })

    return {
        "destination": destination,
        "total_estimated_cost": round(total_budget * 0.85, 2),
        "currency": currency,
        "days": days,
        "accommodation_suggestions": [
            f"[DEMO] Stay in {destination} City Center for easy access to attractions.",
            "[DEMO] Boutique hotels in Old Town offer the best local experience.",
        ],
        "transport_tips": [
            "[DEMO] Purchase a multi-day transit pass for unlimited public transport.",
            "[DEMO] Rideshare apps are widely available and reliable.",
        ],
        "packing_suggestions": [
            "[DEMO] Comfortable walking shoes are essential.",
            "[DEMO] A light jacket for evenings.",
        ],
        "travel_reminders": [
            "[DEMO] This is AI-generated demo content. Verify all details before traveling.",
            "[DEMO] Book popular restaurants and attractions in advance.",
        ],
    }


def generate_mock_single_day(
    destination: str,
    day_number: int,
    day_date: date,
    daily_budget: float,
    feedback: Optional[str] = None,
    currency: str = "USD",
) -> dict:
    """Generate a single mock day for day regeneration."""
    activities = _make_activities(destination, day_number + 3, num_activities=4)
    theme_idx = day_number % len(_DAY_THEMES)

    return {
        "day_number": day_number,
        "date": day_date.isoformat(),
        "theme": f"[DEMO] Regenerated: {_DAY_THEMES[theme_idx]}",
        "activities": activities,
        "daily_budget": daily_budget,
        "transportation_note": f"[DEMO] Regenerated day {day_number}: Alternative routing suggested.",
    }


def generate_mock_recommendations(
    interests: list[str],
    budget_range: str,
    trip_duration_days: int,
) -> dict:
    """Generate mock destination recommendations."""
    interests_str = ", ".join(interests[:2]) if interests else "travel"
    destinations = [
        {
            "name": "Kyoto",
            "country": "Japan",
            "region": "Kansai",
            "reasoning": f"[DEMO] Kyoto perfectly matches your interests in {interests_str} with rich cultural experiences.",
            "highlights": ["Ancient temples", "Traditional tea ceremonies", "Bamboo forests"],
            "suggested_duration_days": max(3, trip_duration_days),
            "approximate_budget_range": "$100-200/day",
            "ideal_traveler_type": "Culture enthusiasts and history lovers",
            "activities": ["Temple hopping", "Tea ceremony", "Arashiyama bamboo grove"],
        },
        {
            "name": "Lisbon",
            "country": "Portugal",
            "region": "Western Europe",
            "reasoning": f"[DEMO] Lisbon offers excellent value with rich {interests_str} experiences.",
            "highlights": ["Historic trams", "Fado music", "Atlantic views"],
            "suggested_duration_days": max(3, trip_duration_days),
            "approximate_budget_range": "$80-150/day",
            "ideal_traveler_type": "Food lovers and urban explorers",
            "activities": ["Alfama exploration", "Tram 28 ride", "Belém Tower"],
        },
        {
            "name": "Chiang Mai",
            "country": "Thailand",
            "region": "Northern Thailand",
            "reasoning": f"[DEMO] Chiang Mai is ideal for {interests_str} on a {budget_range} budget.",
            "highlights": ["Night bazaar", "Elephant sanctuary", "Ancient temples"],
            "suggested_duration_days": max(4, trip_duration_days),
            "approximate_budget_range": "$40-80/day",
            "ideal_traveler_type": "Adventure seekers and budget travelers",
            "activities": ["Doi Inthanon national park", "Thai cooking class", "Night market"],
        },
    ]
    return {"destinations": destinations}
