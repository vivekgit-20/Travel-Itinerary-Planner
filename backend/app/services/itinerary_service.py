"""
Itinerary service — orchestrates AI generation, optimization, budget allocation,
and DB persistence for complete trip itineraries.
"""
from __future__ import annotations

from typing import Optional
import logging
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.trip import TripCreate, TripResponse, ItineraryDaySchema, ActivitySchema
from app.services import ai_service
from app.services.optimization_service import group_by_neighborhood
from app.services.budget_service import allocate_budget
from app.repositories.trip_repository import TripRepository

logger = logging.getLogger(__name__)


def _model_to_day_schema(day_model) -> ItineraryDaySchema:
    activities = []
    for i, act in enumerate(day_model.activities or []):
        activities.append(ActivitySchema(
            id=act.get("id") or f"act_{day_model.day_number}_{i+1:02d}",
            name=act.get("name", "Activity"),
            description=act.get("description", ""),
            location=act.get("location", ""),
            neighborhood=act.get("neighborhood"),
            start_time=act.get("start_time", "09:00"),
            end_time=act.get("end_time", "10:00"),
            estimated_cost=float(act.get("estimated_cost", 0)),
            currency=act.get("currency", "USD"),
            category=act.get("category", "other"),
            booking_url=act.get("booking_url"),
            practical_notes=act.get("practical_notes"),
            why_recommended=act.get("why_recommended"),
        ))
    return ItineraryDaySchema(
        id=str(day_model.id),
        trip_id=str(day_model.trip_id),
        day_number=day_model.day_number,
        date=day_model.date,
        theme=day_model.theme,
        activities=activities,
        daily_budget=float(day_model.daily_budget),
        transportation_note=getattr(day_model, "transportation_note", None),
        created_at=str(day_model.created_at),
        updated_at=str(day_model.updated_at),
    )


def _model_to_trip_response(trip_model, days: list) -> TripResponse:
    return TripResponse(
        id=str(trip_model.id),
        user_id=str(trip_model.user_id),
        title=trip_model.title,
        destination=trip_model.destination,
        start_date=trip_model.start_date,
        end_date=trip_model.end_date,
        duration_days=trip_model.duration_days,
        travelers_count=trip_model.travelers_count,
        traveler_type=trip_model.traveler_type,
        budget_amount=float(trip_model.budget_amount),
        budget_currency=trip_model.budget_currency,
        travel_pace=trip_model.travel_pace,
        interests=trip_model.interests or [],
        preferences=trip_model.preferences or {},
        status=trip_model.status,
        itinerary_days=days,
        created_at=str(trip_model.created_at),
        updated_at=str(trip_model.updated_at),
    )


async def generate_itinerary(trip_create: TripCreate, user_id: str, db: AsyncSession) -> TripResponse:
    repo = TripRepository(db)
    trip = await repo.create(trip_create, user_id, status="draft")
    try:
        raw_itinerary = await ai_service.generate_itinerary(trip_create)
        expected_days = trip_create.duration_days
        raw_days = raw_itinerary.get("days", [])
        while len(raw_days) < expected_days:
            last = dict(raw_days[-1]) if raw_days else {"theme": "Free Day", "activities": []}
            last["day_number"] = len(raw_days) + 1
            last["date"] = (trip_create.start_date + timedelta(days=len(raw_days))).isoformat()
            raw_days.append(last)
        raw_itinerary["days"] = raw_days[:expected_days]
        optimized = group_by_neighborhood(raw_itinerary)
        allocated = allocate_budget(optimized, trip_create.budget_amount, trip_create.travelers_count)
        day_models = []
        for day_data in allocated["days"]:
            d = await repo.create_day(
                trip_id=str(trip.id),
                day_number=day_data["day_number"],
                day_data={
                    "date": date.fromisoformat(day_data["date"]) if isinstance(day_data["date"], str) else day_data["date"],
                    "theme": day_data.get("theme", f"Day {day_data['day_number']}"),
                    "activities": day_data.get("activities", []),
                    "daily_budget": day_data.get("daily_budget", 0),
                },
            )
            day_models.append(d)
        updated_trip = await repo.update_status(str(trip.id), "active")
        if updated_trip is not None:
            trip = updated_trip
        trip.status = "active"
        # Eagerly load all scalar attributes while still inside the async session
        # to avoid lazy-load attempts after the session closes.
        await db.refresh(trip)
        return _model_to_trip_response(trip, [_model_to_day_schema(d) for d in day_models])
    except Exception as e:
        logger.error(f"Trip generation failed for {trip.id}: {e}")
        try:
            await repo.delete(str(trip.id), user_id)
        except Exception:
            pass
        raise


async def regenerate_day(trip_id: str, day_number: int, user_id: str, feedback: Optional[str], db: AsyncSession) -> ItineraryDaySchema:
    from fastapi import HTTPException
    repo = TripRepository(db)
    trip = await repo.get(trip_id, user_id)
    if not trip:
        raise HTTPException(status_code=403, detail="Trip not found or access denied")
    original_day = await repo.get_day(trip_id, day_number)
    if not original_day:
        raise HTTPException(status_code=404, detail=f"Day {day_number} not found")
    trip_create = TripCreate(
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        budget_amount=float(trip.budget_amount),
        budget_currency=trip.budget_currency,
        travelers_count=trip.travelers_count,
        traveler_type=trip.traveler_type,
        travel_pace=trip.travel_pace,
        interests=trip.interests or ["general"],
        accommodation_pref=trip.preferences.get("accommodation_pref", "hotel"),
        dietary_preferences=trip.preferences.get("dietary_preferences", []),
        accessibility_needs=trip.preferences.get("accessibility_needs", []),
    )
    daily_budget = float(original_day.daily_budget)
    new_day_data = await ai_service.regenerate_day(
        trip=trip_create, day_number=day_number, day_date=original_day.date,
        daily_budget=daily_budget, feedback=feedback,
    )
    optimized = group_by_neighborhood({"days": [new_day_data]})
    optimized_day = optimized["days"][0]
    optimized_day["daily_budget"] = daily_budget
    updated = await repo.update_day(
        trip_id=trip_id, day_number=day_number,
        day_data={
            "date": original_day.date,
            "theme": optimized_day.get("theme", f"Day {day_number}"),
            "activities": optimized_day.get("activities", []),
            "daily_budget": daily_budget,
        },
    )
    return _model_to_day_schema(updated)
