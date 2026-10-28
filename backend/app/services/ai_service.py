"""
AI service: wraps the Gemini API with retry logic, JSON validation,
and automatic fallback to the deterministic mock provider.

Uses USE_MOCK_AI=true (default) for local dev to avoid API calls.
"""

from __future__ import annotations

from typing import Optional

import asyncio
import json
import logging
from datetime import date

import httpx

from app.core.config import get_settings
from app.services.ai_schemas import (
    ITINERARY_JSON_SCHEMA,
    SINGLE_DAY_SCHEMA,
    RECOMMENDATION_SCHEMA,
)
from app.services.mock_ai_provider import (
    generate_mock_itinerary,
    generate_mock_single_day,
    generate_mock_recommendations,
)
from app.schemas.trip import TripCreate

logger = logging.getLogger(__name__)

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3-flash-preview:generateContent"
)

MAX_RETRIES = 3
BASE_DELAY = 1.0  # seconds


class AIServiceError(Exception):
    """Raised when the AI service fails after all retries."""
    pass


def _validate_required_fields(data: dict, schema: dict) -> bool:
    """Basic validation: check top-level required fields exist."""
    required = schema.get("required", [])
    for field in required:
        if field not in data:
            return False
    if "days" in data:
        days = data.get("days", [])
        if not isinstance(days, list) or len(days) == 0:
            return False
    return True


async def _call_gemini(prompt: str, api_key: str) -> dict:
    """Make a single call to the Gemini API and return parsed JSON."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            GEMINI_API_URL,
            headers={"x-goog-api-key": api_key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.7,
                    "maxOutputTokens": 8192,
                },
            },
        )
        response.raise_for_status()
        result = response.json()
        raw_text = result["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw_text)


async def generate_itinerary(trip: TripCreate) -> dict:
    """
    Generate a full multi-day itinerary.

    Returns a dict matching ITINERARY_JSON_SCHEMA.
    Uses mock provider when USE_MOCK_AI=true.
    Retries up to MAX_RETRIES times with exponential backoff on failure.
    """
    settings = get_settings()

    if settings.use_mock_ai:
        logger.info("Using mock AI provider for itinerary generation")
        return generate_mock_itinerary(
            destination=trip.destination,
            start_date=trip.start_date,
            duration_days=trip.duration_days,
            total_budget=trip.budget_amount,
            currency=trip.budget_currency,
        )

    from app.services.prompt_builder import build_itinerary_prompt
    prompt = build_itinerary_prompt(trip, trip.duration_days)

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            data = await _call_gemini(prompt, settings.gemini_api_key)
            if not _validate_required_fields(data, ITINERARY_JSON_SCHEMA):
                raise ValueError(f"AI response missing required fields: {list(data.keys())}")
            return data
        except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                delay = BASE_DELAY * (2 ** attempt)
                logger.warning(f"AI request failed (attempt {attempt+1}/{MAX_RETRIES}), retrying in {delay}s: {e}")
                await asyncio.sleep(delay)
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            last_error = e
            # Append a correction instruction on schema failures
            prompt += "\n\nIMPORTANT: Your previous response was not valid JSON matching the required schema. Return ONLY a valid JSON object."
            if attempt < MAX_RETRIES - 1:
                delay = BASE_DELAY * (2 ** attempt)
                await asyncio.sleep(delay)

    raise AIServiceError(f"AI itinerary generation failed after {MAX_RETRIES} attempts: {last_error}")


async def regenerate_day(
    trip: TripCreate,
    day_number: int,
    day_date: date,
    daily_budget: float,
    feedback: Optional[str] = None,
) -> dict:
    """
    Regenerate a single day.
    Returns a dict matching SINGLE_DAY_SCHEMA.
    """
    settings = get_settings()

    if settings.use_mock_ai:
        return generate_mock_single_day(
            destination=trip.destination,
            day_number=day_number,
            day_date=day_date,
            daily_budget=daily_budget,
            feedback=feedback,
            currency=trip.budget_currency,
        )

    from app.services.prompt_builder import build_regeneration_prompt
    prompt = build_regeneration_prompt(trip, day_number, day_date, daily_budget, feedback)

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            data = await _call_gemini(prompt, settings.gemini_api_key)
            if not _validate_required_fields(data, SINGLE_DAY_SCHEMA):
                raise ValueError("Single-day response missing required fields")
            return data
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BASE_DELAY * (2 ** attempt))

    raise AIServiceError(f"Day regeneration failed after {MAX_RETRIES} attempts: {last_error}")


async def get_recommendations(
    interests: list[str],
    traveler_type: str,
    budget_range: str,
    trip_duration_days: int,
) -> dict:
    """
    Get AI destination recommendations.
    Returns a dict matching RECOMMENDATION_SCHEMA.
    """
    settings = get_settings()

    if settings.use_mock_ai:
        return generate_mock_recommendations(interests, budget_range, trip_duration_days)

    from app.services.prompt_builder import build_recommendation_prompt
    prompt = build_recommendation_prompt(interests, traveler_type, budget_range, trip_duration_days)

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            data = await _call_gemini(prompt, settings.gemini_api_key)
            if not _validate_required_fields(data, RECOMMENDATION_SCHEMA):
                raise ValueError("Recommendation response missing required fields")
            return data
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(BASE_DELAY * (2 ** attempt))

    raise AIServiceError(f"Recommendations failed after {MAX_RETRIES} attempts: {last_error}")
