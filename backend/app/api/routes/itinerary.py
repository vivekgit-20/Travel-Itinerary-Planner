"""Itinerary day management endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limiter import limiter
from app.database.connection import get_db
from app.dependencies import verify_jwt
from app.schemas.trip import ItineraryDaySchema, ItineraryDayUpdate, RegenerateDayRequest, MessageResponse
from app.repositories.trip_repository import TripRepository
from app.services import itinerary_service
from app.services.itinerary_service import _model_to_day_schema

router = APIRouter(prefix="/itinerary", tags=["itinerary"])


@router.put("/{trip_id}/days/{day_number}", response_model=ItineraryDaySchema)
async def update_day(
    trip_id: str,
    day_number: int,
    update_data: ItineraryDayUpdate,
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """Update a single itinerary day. Verifies ownership."""
    repo = TripRepository(db)
    trip = await repo.get(trip_id, user_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    update_dict = update_data.model_dump(exclude_none=True)
    day = await repo.update_day(trip_id, day_number, update_dict)
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Day {day_number} not found")
    return _model_to_day_schema(day)


@router.put("/{trip_id}/days/{day_number}/activities", response_model=ItineraryDaySchema)
async def reorder_activities(
    trip_id: str,
    day_number: int,
    activities: list = Body(...),
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """Replace the activity list for a day (used for reordering). Verifies ownership."""
    repo = TripRepository(db)
    trip = await repo.get(trip_id, user_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    day = await repo.update_day(trip_id, day_number, {"activities": activities})
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Day {day_number} not found")
    return _model_to_day_schema(day)


@router.post("/{trip_id}/regenerate-day", response_model=ItineraryDaySchema)
@limiter.limit("10/minute")
async def regenerate_day(
    request: Request,
    trip_id: str,
    regen_request: RegenerateDayRequest,
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate a single day without touching other days. Verifies ownership."""
    from app.services.ai_service import AIServiceError
    try:
        return await itinerary_service.regenerate_day(
            trip_id=trip_id,
            day_number=regen_request.day_number,
            user_id=user_id,
            feedback=regen_request.feedback,
            db=db,
        )
    except AIServiceError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service temporarily unavailable. Please try again.",
        )
