"""Profile endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies import verify_jwt
from app.schemas.trip import ProfileUpdate, ProfileResponse
from app.repositories.profile_repository import ProfileRepository

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile(
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    repo = ProfileRepository(db)
    profile = await repo.get_or_create(user_id)
    return ProfileResponse(
        id=str(profile.id),
        display_name=profile.display_name,
        preferences=profile.preferences or {},
        created_at=str(profile.created_at),
        updated_at=str(profile.updated_at),
    )


@router.put("", response_model=ProfileResponse)
async def update_profile(
    update_data: ProfileUpdate,
    user_id: str = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db),
):
    repo = ProfileRepository(db)
    profile = await repo.update(user_id, update_data)
    return ProfileResponse(
        id=str(profile.id),
        display_name=profile.display_name,
        preferences=profile.preferences or {},
        created_at=str(profile.created_at),
        updated_at=str(profile.updated_at),
    )
