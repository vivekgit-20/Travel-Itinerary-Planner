"""
Pydantic schemas for the Travel Itinerary Planner API.
All models use Pydantic v2 style (model_config instead of class Config).
"""

from __future__ import annotations

from datetime import date
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Activity
# ---------------------------------------------------------------------------

class ActivityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=300)
    description: str = Field(min_length=1, max_length=2000)
    location: str = Field(min_length=1, max_length=300)
    neighborhood: Optional[str] = None
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")  # HH:MM
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    estimated_cost: float = Field(ge=0)
    currency: str = Field(default="USD", max_length=3)
    category: str = Field(min_length=1, max_length=100)
    booking_url: Optional[str] = None
    practical_notes: Optional[str] = None
    why_recommended: Optional[str] = None


class ActivitySchema(ActivityCreate):
    id: str


# ---------------------------------------------------------------------------
# Itinerary Day
# ---------------------------------------------------------------------------

class ItineraryDayCreate(BaseModel):
    day_number: int = Field(ge=1)
    date: date
    theme: str = Field(min_length=1, max_length=300)
    activities: list[ActivityCreate] = Field(min_length=0)
    daily_budget: float = Field(ge=0, default=0.0)
    transportation_note: Optional[str] = None


class ItineraryDaySchema(BaseModel):
    id: str
    trip_id: str
    day_number: int
    date: date
    theme: str
    activities: list[ActivitySchema]
    daily_budget: float
    transportation_note: Optional[str] = None
    created_at: str
    updated_at: str


class ItineraryDayUpdate(BaseModel):
    theme: Optional[str] = Field(None, min_length=1, max_length=300)
    activities: Optional[list[ActivityCreate]] = None
    daily_budget: Optional[float] = Field(None, ge=0)
    transportation_note: Optional[str] = None


# ---------------------------------------------------------------------------
# Trip
# ---------------------------------------------------------------------------

TravelType = Literal["solo", "couple", "family", "friends"]
TravelPace = Literal["relaxed", "moderate", "fast-paced"]
TripStatus = Literal["draft", "active", "completed"]

ALLOWED_INTERESTS = {
    "food", "adventure", "history", "culture", "nature", "beaches",
    "mountains", "shopping", "nightlife", "architecture", "photography",
    "local-experiences",
}


class TripCreate(BaseModel):
    destination: str = Field(min_length=2, max_length=200)
    start_date: date
    end_date: date
    budget_amount: float = Field(gt=0)
    budget_currency: str = Field(default="USD", max_length=3)
    travelers_count: int = Field(ge=1, le=50)
    traveler_type: TravelType
    travel_pace: TravelPace
    interests: list[str] = Field(min_length=1)
    accommodation_pref: str = Field(default="hotel", max_length=100)
    dietary_preferences: list[str] = Field(default=[])
    accessibility_needs: list[str] = Field(default=[])
    special_requests: Optional[str] = Field(None, max_length=1000)

    @field_validator("destination")
    @classmethod
    def destination_not_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Destination must not be empty or whitespace only")
        return v.strip()

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: list[str]) -> list[str]:
        cleaned = [i.lower().strip() for i in v if i.strip()]
        if not cleaned:
            raise ValueError("At least one interest must be provided")
        return cleaned

    @model_validator(mode="after")
    def end_date_after_start_date(self) -> "TripCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self

    @property
    def duration_days(self) -> int:
        return (self.end_date - self.start_date).days + 1


class TripUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    status: Optional[TripStatus] = None
    preferences: Optional[dict] = None


class TripSummary(BaseModel):
    id: str
    title: str
    destination: str
    start_date: date
    end_date: date
    duration_days: int
    travelers_count: int
    traveler_type: TravelType
    budget_amount: float
    budget_currency: str
    status: TripStatus
    created_at: str
    updated_at: str


class TripResponse(TripSummary):
    user_id: str
    travel_pace: TravelPace
    interests: list[str]
    preferences: dict
    itinerary_days: list[ItineraryDaySchema] = []


# ---------------------------------------------------------------------------
# Budget
# ---------------------------------------------------------------------------

class DailyBudgetEntry(BaseModel):
    day_number: int
    date: date
    allocated: float
    actual_activities_cost: float


class BudgetSummary(BaseModel):
    total_budget: float
    total_allocated: float
    per_person: float
    daily_breakdown: list[DailyBudgetEntry]
    over_budget: bool
    remaining: float


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

class RecommendationRequest(BaseModel):
    interests: list[str] = Field(min_length=1)
    traveler_type: TravelType
    budget_range: Literal["budget", "mid-range", "luxury"]
    trip_duration_days: int = Field(ge=1, le=90)
    preferred_climate: Optional[str] = None


class DestinationRecommendation(BaseModel):
    name: str
    country: str
    region: Optional[str] = None
    reasoning: str
    highlights: list[str]
    suggested_duration_days: int
    approximate_budget_range: str
    ideal_traveler_type: str
    activities: list[str]


class RecommendationResponse(BaseModel):
    destinations: list[DestinationRecommendation]


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    dietary_preferences: list[str] = Field(default=[])
    accessibility_needs: list[str] = Field(default=[])
    default_travel_type: Optional[TravelType] = None
    default_travel_pace: Optional[TravelPace] = None
    default_currency: str = Field(default="USD", max_length=3)
    default_accommodation_pref: Optional[str] = Field(None, max_length=100)


class ProfileResponse(BaseModel):
    id: str
    display_name: Optional[str]
    preferences: dict
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Regenerate Day
# ---------------------------------------------------------------------------

class RegenerateDayRequest(BaseModel):
    day_number: int = Field(ge=1)
    feedback: Optional[str] = Field(None, max_length=500)


# ---------------------------------------------------------------------------
# Generic API responses
# ---------------------------------------------------------------------------

class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str
