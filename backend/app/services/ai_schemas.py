"""
JSON Schema definitions for AI-generated itinerary responses.

These schemas are used to:
  1. Instruct the Gemini API to return structured JSON
  2. Validate the AI response before processing

Both schemas are aligned with the Pydantic models in app/schemas/trip.py.
"""

ACTIVITY_SCHEMA = {
    "type": "object",
    "required": ["id", "name", "description", "location", "start_time", "end_time", "estimated_cost", "category"],
    "properties": {
        "id": {"type": "string", "description": "Unique identifier, e.g. act_001"},
        "name": {"type": "string", "minLength": 1, "maxLength": 300},
        "description": {"type": "string", "minLength": 1, "maxLength": 2000},
        "location": {"type": "string", "minLength": 1},
        "neighborhood": {"type": "string", "description": "District or neighborhood name, e.g. 'Old Town'"},
        "start_time": {"type": "string", "pattern": "^\\d{2}:\\d{2}$", "description": "HH:MM format"},
        "end_time": {"type": "string", "pattern": "^\\d{2}:\\d{2}$", "description": "HH:MM format"},
        "estimated_cost": {"type": "number", "minimum": 0, "description": "Cost in the trip currency"},
        "currency": {"type": "string", "default": "USD"},
        "category": {
            "type": "string",
            "enum": ["sightseeing", "food", "adventure", "culture", "nature", "shopping", "nightlife",
                     "transport", "accommodation", "photography", "local-experience", "other"]
        },
        "practical_notes": {"type": "string"},
        "why_recommended": {"type": "string", "description": "Why this matches the user's interests"},
    },
    "additionalProperties": True,
}

ITINERARY_DAY_SCHEMA = {
    "type": "object",
    "required": ["day_number", "date", "theme", "activities", "daily_budget"],
    "properties": {
        "day_number": {"type": "integer", "minimum": 1},
        "date": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$", "description": "ISO 8601 date"},
        "theme": {"type": "string", "minLength": 1, "maxLength": 300,
                  "description": "Daily theme, e.g. 'Historical Downtown & Food Tour'"},
        "activities": {
            "type": "array",
            "items": ACTIVITY_SCHEMA,
            "minItems": 1,
        },
        "daily_budget": {"type": "number", "minimum": 0},
        "transportation_note": {"type": "string", "description": "Transportation tips for the day"},
    },
    "additionalProperties": True,
}

# Full itinerary schema — returned by AI for a complete trip
ITINERARY_JSON_SCHEMA = {
    "type": "object",
    "required": ["destination", "days"],
    "properties": {
        "destination": {"type": "string"},
        "total_estimated_cost": {"type": "number", "minimum": 0},
        "currency": {"type": "string", "default": "USD"},
        "days": {
            "type": "array",
            "items": ITINERARY_DAY_SCHEMA,
            "minItems": 1,
        },
        "accommodation_suggestions": {
            "type": "array",
            "items": {"type": "string"},
        },
        "transport_tips": {
            "type": "array",
            "items": {"type": "string"},
        },
        "packing_suggestions": {
            "type": "array",
            "items": {"type": "string"},
        },
        "travel_reminders": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "additionalProperties": True,
}

# Single-day regeneration schema
SINGLE_DAY_SCHEMA = {
    "type": "object",
    "required": ["day_number", "date", "theme", "activities", "daily_budget"],
    "properties": {
        **ITINERARY_DAY_SCHEMA["properties"],
    },
    "additionalProperties": True,
}

# Recommendation schema — returned by AI for destination suggestions
RECOMMENDATION_SCHEMA = {
    "type": "object",
    "required": ["destinations"],
    "properties": {
        "destinations": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name", "country", "reasoning", "highlights"],
                "properties": {
                    "name": {"type": "string"},
                    "country": {"type": "string"},
                    "region": {"type": "string"},
                    "reasoning": {"type": "string", "description": "Why this matches user preferences"},
                    "highlights": {"type": "array", "items": {"type": "string"}},
                    "suggested_duration_days": {"type": "integer", "minimum": 1},
                    "approximate_budget_range": {"type": "string"},
                    "ideal_traveler_type": {"type": "string"},
                    "activities": {"type": "array", "items": {"type": "string"}},
                },
                "additionalProperties": True,
            },
            "minItems": 1,
            "maxItems": 5,
        }
    },
}
