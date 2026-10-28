"""PDF export endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io

from app.database.connection import get_db
from app.dependencies import verify_jwt
from app.repositories.trip_repository import TripRepository
from app.services import pdf_service
from app.services.itinerary_service import _model_to_day_schema, _model_to_trip_response
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.get("/{trip_id}")
async def export_pdf(
    trip_id: str,
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    """Generate and stream a PDF travel guide for the given trip."""
    repo = TripRepository(db)
    trip = await repo.get(trip_id, user_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    days = [_model_to_day_schema(d) for d in (trip.itinerary_days or [])]
    trip_response = _model_to_trip_response(trip, days)

    try:
        pdf_bytes = await pdf_service.generate_pdf(trip_response)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF. Please try again.",
        )

    filename = f"{trip.destination.replace(' ', '_')}_itinerary.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
