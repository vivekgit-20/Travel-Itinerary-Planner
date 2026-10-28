"""Destination recommendations endpoint."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.limiter import limiter
from app.dependencies import verify_jwt
from app.schemas.trip import RecommendationRequest, RecommendationResponse
from app.services import ai_service
from app.services.ai_service import AIServiceError

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("", response_model=RecommendationResponse)
@limiter.limit("20/minute")
async def get_recommendations(
    request: Request,
    request_body: RecommendationRequest,
    user_id: str = Depends(verify_jwt),
):
    """Get AI-powered destination recommendations based on user preferences."""
    try:
        data = await ai_service.get_recommendations(
            interests=request_body.interests,
            traveler_type=request_body.traveler_type,
            budget_range=request_body.budget_range,
            trip_duration_days=request_body.trip_duration_days,
        )
        return RecommendationResponse(destinations=data.get("destinations", []))
    except AIServiceError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service temporarily unavailable. Please try again.",
        )
