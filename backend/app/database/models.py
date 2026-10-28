"""
SQLAlchemy ORM models for the Travel Itinerary Planner.
Designed to work with both SQLite (local dev) and PostgreSQL (production via Supabase).
"""

from __future__ import annotations

import uuid
from datetime import datetime, date as date_type
from typing import Any

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint, Text, JSON, Numeric
)
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func


def _uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


class TripModel(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    destination = Column(String(200), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration_days = Column(Integer, nullable=False)
    travelers_count = Column(Integer, nullable=False)
    traveler_type = Column(String(20), nullable=False)
    budget_amount = Column(Numeric(12, 2), nullable=False)
    budget_currency = Column(String(3), nullable=False, default="USD")
    travel_pace = Column(String(20), nullable=False)
    interests = Column(JSON, nullable=False, default=list)    # stored as JSON array
    preferences = Column(JSON, nullable=False, default=dict)  # JSONB equivalent
    status = Column(String(20), nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("travelers_count >= 1", name="ck_trips_travelers"),
        CheckConstraint("budget_amount > 0", name="ck_trips_budget"),
        CheckConstraint(
            "traveler_type IN ('solo','couple','family','friends')",
            name="ck_trips_traveler_type"
        ),
        CheckConstraint(
            "travel_pace IN ('relaxed','moderate','fast-paced')",
            name="ck_trips_travel_pace"
        ),
        CheckConstraint(
            "status IN ('draft','active','completed')",
            name="ck_trips_status"
        ),
    )

    # Relationship: one trip -> many itinerary days (cascade delete)
    itinerary_days = relationship(
        "ItineraryDayModel",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="ItineraryDayModel.day_number",
    )


class ItineraryDayModel(Base):
    __tablename__ = "itinerary_days"

    id = Column(String, primary_key=True, default=_uuid)
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    theme = Column(String(300), nullable=False)
    activities = Column(JSON, nullable=False, default=list)
    daily_budget = Column(Numeric(12, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("trip_id", "day_number", name="uq_itinerary_days_trip_day"),
        CheckConstraint("day_number >= 1", name="ck_itinerary_days_day_number"),
    )

    trip = relationship("TripModel", back_populates="itinerary_days")


class ProfileModel(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True)  # same as auth.users.id
    display_name = Column(String(100), nullable=True)
    preferences = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
