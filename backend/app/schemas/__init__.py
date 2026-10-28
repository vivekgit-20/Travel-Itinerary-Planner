"""
Schemas package for the Travel Itinerary Planner API.
"""

from app.schemas.trip import (
    # Activity
    ActivityCreate,
    ActivitySchema,
    # Itinerary Day
    ItineraryDayCreate,
    ItineraryDaySchema,
    ItineraryDayUpdate,
    # Trip
    TravelType,
    TravelPace,
    TripStatus,
    ALLOWED_INTERESTS,
    TripCreate,
    TripUpdate,
    TripSummary,
    TripResponse,
    # Budget
    DailyBudgetEntry,
    BudgetSummary,
    # Recommendations
    RecommendationRequest,
    DestinationRecommendation,
    RecommendationResponse,
    # Profile
    ProfileUpdate,
    ProfileResponse,
    # Regenerate Day
    RegenerateDayRequest,
    # Generic responses
    MessageResponse,
    ErrorResponse,
)

__all__ = [
    "ActivityCreate",
    "ActivitySchema",
    "ItineraryDayCreate",
    "ItineraryDaySchema",
    "ItineraryDayUpdate",
    "TravelType",
    "TravelPace",
    "TripStatus",
    "ALLOWED_INTERESTS",
    "TripCreate",
    "TripUpdate",
    "TripSummary",
    "TripResponse",
    "DailyBudgetEntry",
    "BudgetSummary",
    "RecommendationRequest",
    "DestinationRecommendation",
    "RecommendationResponse",
    "ProfileUpdate",
    "ProfileResponse",
    "RegenerateDayRequest",
    "MessageResponse",
    "ErrorResponse",
]
