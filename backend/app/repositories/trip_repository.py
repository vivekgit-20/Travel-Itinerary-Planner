"""
Trip_Repository: async data-access layer for the trips and itinerary_days tables.

All queries use SQLAlchemy parameterized expressions — no raw string interpolation.
All operations that read or modify trips perform an explicit user_id ownership check.
"""

from __future__ import annotations

import uuid
from datetime import date as date_type
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import TripModel, ItineraryDayModel
from app.schemas.trip import TripCreate, TripUpdate, ItineraryDayCreate, ItineraryDayUpdate


class TripRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ------------------------------------------------------------------
    # Trip operations
    # ------------------------------------------------------------------

    async def create(
        self,
        trip_create: TripCreate,
        user_id: str,
        status: str = "draft",
    ) -> TripModel:
        """
        Preconditions:
          - trip_create is a valid TripCreate instance
          - user_id is a verified JWT sub claim
          - status in {'draft', 'active', 'completed'}

        Postconditions:
          - A new TripModel row is inserted
          - Returns TripModel with auto-generated id
          - trip.user_id == user_id
        """
        trip = TripModel(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=f"{trip_create.destination} Trip",
            destination=trip_create.destination,
            start_date=trip_create.start_date,
            end_date=trip_create.end_date,
            duration_days=trip_create.duration_days,
            travelers_count=trip_create.travelers_count,
            traveler_type=trip_create.traveler_type,
            budget_amount=trip_create.budget_amount,
            budget_currency=trip_create.budget_currency,
            travel_pace=trip_create.travel_pace,
            interests=trip_create.interests,
            preferences={
                "accommodation_pref": trip_create.accommodation_pref,
                "dietary_preferences": trip_create.dietary_preferences,
                "accessibility_needs": trip_create.accessibility_needs,
                "special_requests": trip_create.special_requests,
            },
            status=status,
        )
        self.db.add(trip)
        await self.db.flush()
        await self.db.refresh(trip)
        return trip

    async def get(self, trip_id: str, user_id: Optional[str] = None) -> Optional[TripModel]:
        """
        Get a trip by id. If user_id is provided, verify ownership.

        Returns None if not found or owned by a different user.
        """
        stmt = (
            select(TripModel)
            .where(TripModel.id == trip_id)
            .options(selectinload(TripModel.itinerary_days))
        )
        if user_id:
            stmt = stmt.where(TripModel.user_id == user_id)

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: str) -> list[TripModel]:
        """Return all trips for a user, ordered by created_at descending."""
        stmt = (
            select(TripModel)
            .where(TripModel.user_id == user_id)
            .order_by(TripModel.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update(
        self, trip_id: str, user_id: str, update_data: TripUpdate
    ) -> Optional[TripModel]:
        """Update trip metadata. Verifies ownership before update."""
        trip = await self.get(trip_id, user_id)
        if not trip:
            return None

        if update_data.title is not None:
            trip.title = update_data.title
        if update_data.status is not None:
            trip.status = update_data.status
        if update_data.preferences is not None:
            trip.preferences = update_data.preferences

        await self.db.flush()
        await self.db.refresh(trip)
        return trip

    async def update_status(self, trip_id: str, status: str) -> Optional[TripModel]:
        """Update trip status without ownership check (internal use only)."""
        stmt = select(TripModel).where(TripModel.id == trip_id)
        result = await self.db.execute(stmt)
        trip = result.scalar_one_or_none()
        if not trip:
            return None
        trip.status = status
        await self.db.flush()
        return trip

    async def delete(self, trip_id: str, user_id: str) -> bool:
        """
        Delete a trip and all its itinerary_days (via cascade).
        Returns True if deleted, False if not found or not owned.
        """
        trip = await self.get(trip_id, user_id)
        if not trip:
            return False
        await self.db.delete(trip)
        await self.db.flush()
        return True

    # ------------------------------------------------------------------
    # ItineraryDay operations
    # ------------------------------------------------------------------

    async def create_day(
        self,
        trip_id: str,
        day_number: int,
        day_data: dict,
    ) -> ItineraryDayModel:
        """
        Preconditions:
          - trip_id references an existing trip
          - day_number >= 1 and unique for this trip
          - day_data contains theme, activities, daily_budget, date fields

        Postconditions:
          - A new ItineraryDayModel row is inserted
          - Returns the created ItineraryDayModel
        """
        day = ItineraryDayModel(
            id=str(uuid.uuid4()),
            trip_id=trip_id,
            day_number=day_number,
            date=day_data["date"],
            theme=day_data.get("theme", f"Day {day_number}"),
            activities=day_data.get("activities", []),
            daily_budget=float(day_data.get("daily_budget", 0)),
        )
        self.db.add(day)
        await self.db.flush()
        await self.db.refresh(day)
        return day

    async def get_day(self, trip_id: str, day_number: int) -> Optional[ItineraryDayModel]:
        """Get a single itinerary day by trip_id and day_number."""
        stmt = select(ItineraryDayModel).where(
            ItineraryDayModel.trip_id == trip_id,
            ItineraryDayModel.day_number == day_number,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_days(self, trip_id: str) -> list[ItineraryDayModel]:
        """Get all itinerary days for a trip, ordered by day_number."""
        stmt = (
            select(ItineraryDayModel)
            .where(ItineraryDayModel.trip_id == trip_id)
            .order_by(ItineraryDayModel.day_number)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_day(
        self,
        trip_id: str,
        day_number: int,
        day_data: dict,
    ) -> Optional[ItineraryDayModel]:
        """
        Update a single itinerary day.

        Postconditions:
          - Only the specified day is updated; all other days are unchanged
          - Returns the updated ItineraryDayModel
        """
        day = await self.get_day(trip_id, day_number)
        if not day:
            return None

        if "theme" in day_data:
            day.theme = day_data["theme"]
        if "activities" in day_data:
            day.activities = day_data["activities"]
        if "daily_budget" in day_data:
            day.daily_budget = float(day_data["daily_budget"])
        if "transportation_note" in day_data:
            day.transportation_note = day_data.get("transportation_note")

        await self.db.flush()
        await self.db.refresh(day)
        return day

    async def delete_all_days(self, trip_id: str) -> int:
        """Delete all itinerary days for a trip. Returns count of deleted rows."""
        stmt = delete(ItineraryDayModel).where(ItineraryDayModel.trip_id == trip_id)
        result = await self.db.execute(stmt)
        return result.rowcount
