"""
Prompt builder — constructs structured prompts for Gemini API calls.

Each function produces a complete, self-contained prompt string that:
  1. Includes all user preference fields (Property 14: Prompt Completeness)
  2. Instructs the model to return valid JSON matching the required schema
  3. Sets clear constraints on pace, budget, and activity scheduling
"""

from __future__ import annotations

from typing import Optional

import json
from datetime import date
from app.schemas.trip import TripCreate
from app.services.ai_schemas import ITINERARY_JSON_SCHEMA, SINGLE_DAY_SCHEMA, RECOMMENDATION_SCHEMA


def build_itinerary_prompt(trip: TripCreate, duration_days: int) -> str:
    """
    Build the main itinerary generation prompt.

    Preconditions:
      - trip is a validated TripCreate instance
      - duration_days >= 1

    Postconditions:
      - Returned string contains: destination, travel_type, travel_pace, budget_amount,
        travelers_count, interests, accommodation_pref, dietary_preferences,
        accessibility_needs, start_date, end_date
      - Returned string instructs model to return JSON matching ITINERARY_JSON_SCHEMA
    """
    interests_str = ", ".join(trip.interests)
    dietary_str = ", ".join(trip.dietary_preferences) if trip.dietary_preferences else "no specific dietary restrictions"
    access_str = ", ".join(trip.accessibility_needs) if trip.accessibility_needs else "no accessibility requirements"
    schema_str = json.dumps(ITINERARY_JSON_SCHEMA, indent=2)

    activities_per_day = {
        "relaxed": "3-4",
        "moderate": "4-5",
        "fast-paced": "5-6",
    }.get(trip.travel_pace, "4")

    return f"""You are an expert travel planner creating a personalized {duration_days}-day travel itinerary.

TRIP DETAILS:
- Destination: {trip.destination}
- Travel dates: {trip.start_date} to {trip.end_date} ({duration_days} days)
- Travel type: {trip.traveler_type}
- Travel pace: {trip.travel_pace}
- Total budget: {trip.budget_amount} {trip.budget_currency} for {trip.travelers_count} traveler(s)
- Daily budget per person: approximately {trip.budget_amount / duration_days / trip.travelers_count:.0f} {trip.budget_currency}
- Interests: {interests_str}
- Accommodation preference: {trip.accommodation_pref}
- Dietary preferences: {dietary_str}
- Accessibility needs: {access_str}
- Special requests: {trip.special_requests or 'none'}

INSTRUCTIONS:
1. Create exactly {duration_days} days of activities (one entry per calendar day from {trip.start_date} to {trip.end_date})
2. Include {activities_per_day} activities per day appropriate for the "{trip.travel_pace}" pace
3. Group activities by neighborhood to minimize unnecessary travel — include a "neighborhood" field for each activity
4. Each day must include at least one meal/food activity matching the dietary preferences
5. Respect the budget: estimated costs should total approximately {trip.budget_amount} {trip.budget_currency}
6. Do NOT overlap activity time slots — use HH:MM format (24-hour)
7. Avoid duplicate attractions across days
8. Add accessibility notes for activities where relevant to the stated needs: {access_str}
9. Include a short "why_recommended" note tying each activity to the traveler's interests
10. Do NOT claim verified prices, hours, or availability — use "approximately" for estimates
11. Start day 1 with an arrival/orientation activity

RESPONSE FORMAT:
Return ONLY a valid JSON object matching this exact schema. No markdown, no explanation, just JSON:
{schema_str}"""


def build_regeneration_prompt(
    trip: TripCreate,
    day_number: int,
    day_date: date,
    daily_budget: float,
    feedback: Optional[str] = None,
) -> str:
    """Build a prompt for regenerating a single day."""
    interests_str = ", ".join(trip.interests)
    dietary_str = ", ".join(trip.dietary_preferences) if trip.dietary_preferences else "none"
    schema_str = json.dumps(SINGLE_DAY_SCHEMA, indent=2)

    feedback_section = f"\nUSER FEEDBACK ON PREVIOUS VERSION: {feedback}" if feedback else ""

    return f"""You are an expert travel planner regenerating Day {day_number} of a trip to {trip.destination}.

TRIP CONTEXT:
- Destination: {trip.destination}
- Day: {day_number} ({day_date})
- Travel type: {trip.traveler_type}
- Travel pace: {trip.travel_pace}
- Daily budget: {daily_budget} {trip.budget_currency} for {trip.travelers_count} traveler(s)
- Interests: {interests_str}
- Dietary preferences: {dietary_str}
{feedback_section}

INSTRUCTIONS:
1. Create a fresh set of activities for Day {day_number} only
2. Do NOT repeat the same activities as other days (assume common tourist spots are already visited)
3. Group by neighborhood to minimize travel
4. Total activity costs should stay within the daily budget of {daily_budget} {trip.budget_currency}
5. Address the user feedback above if provided

Return ONLY a valid JSON object matching this schema:
{schema_str}"""


def build_recommendation_prompt(
    interests: list[str],
    traveler_type: str,
    budget_range: str,
    trip_duration_days: int,
) -> str:
    """Build a prompt for destination recommendations."""
    interests_str = ", ".join(interests)
    schema_str = json.dumps(RECOMMENDATION_SCHEMA, indent=2)

    return f"""You are a travel expert recommending personalized destinations.

TRAVELER PROFILE:
- Travel type: {traveler_type}
- Budget level: {budget_range}
- Trip duration: {trip_duration_days} days
- Interests: {interests_str}

Suggest 3 destinations that best match this profile. For each destination, explain why it matches the interests, what the traveler will love, and realistic budget expectations.

Return ONLY valid JSON matching this schema:
{schema_str}"""
