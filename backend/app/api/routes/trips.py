"""
Trip CRUD endpoints.

All routes require a verified JWT via the verify_jwt dependency.
Ownership is enforced before any read/modify/delete operation.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limiter import limiter
from app.database.connection import get_db
from app.dependencies import verify_jwt
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripSummary, MessageResponse
from app.services import itinerary_service
from app.repositories.trip_repository import TripRepository
from app.services.itinerary_service import _model_to_trip_response, _model_to_day_schema
from app.services.ai_service import AIServiceError

router = APIRouter(prefix="/trips", tags=["trips"])


def _trip_to_summary(trip) -> TripSummary:
    return TripSummary(
        id=str(trip.id),
        title=trip.title,
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        duration_days=trip.duration_days,
        travelers_count=trip.travelers_count,
        traveler_type=trip.traveler_type,
        budget_amount=float(trip.budget_amount),
        budget_currency=trip.budget_currency,
        status=trip.status,
        created_at=str(trip.created_at),
        updated_at=str(trip.updated_at),
    )


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_trip(
    request: Request,
    trip_create: TripCreate,
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """Create a new trip and generate its itinerary via AI."""
    try:
        return await itinerary_service.generate_itinerary(trip_create, user_id, db)
    except AIServiceError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service temporarily unavailable. Please try again.",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create trip. Please try again.",
        )


@router.get("", response_model=List[TripSummary])
async def list_trips(
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """List all trips for the authenticated user, most recent first."""
    repo = TripRepository(db)
    trips = await repo.list_by_user(user_id)
    return [_trip_to_summary(t) for t in trips]


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str,
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """Get a trip with all itinerary days. Returns 404 if not found or not owned."""
    repo = TripRepository(db)
    trip = await repo.get(trip_id, user_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    days = [_model_to_day_schema(d) for d in (trip.itinerary_days or [])]
    return _model_to_trip_response(trip, days)


@router.put("/{trip_id}", response_model=TripSummary)
async def update_trip(
    trip_id: str,
    update_data: TripUpdate,
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """Update trip metadata. Ownership is verified before update."""
    repo = TripRepository(db)
    trip = await repo.update(trip_id, user_id, update_data)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return _trip_to_summary(trip)


@router.delete("/{trip_id}", response_model=MessageResponse)
async def delete_trip(
    trip_id: str,
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """Delete a trip and all its itinerary days. Ownership is verified."""
    repo = TripRepository(db)
    deleted = await repo.delete(trip_id, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return MessageResponse(message="Trip deleted successfully")
