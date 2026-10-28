"""
Profile_Repository: async data-access layer for the profiles table.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import ProfileModel
from app.schemas.trip import ProfileUpdate


class ProfileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create(self, user_id: str) -> ProfileModel:
        """
        Retrieve the profile for user_id, or create a new empty profile if one doesn't exist.

        Preconditions:
          - user_id is a verified JWT sub claim

        Postconditions:
          - Returns a ProfileModel with id == user_id
          - If the profile did not exist, a new row is created with empty preferences
        """
        stmt = select(ProfileModel).where(ProfileModel.id == user_id)
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()

        if profile is None:
            profile = ProfileModel(
                id=user_id,
                display_name=None,
                preferences={},
            )
            self.db.add(profile)
            await self.db.flush()
            await self.db.refresh(profile)

        return profile

    async def get(self, user_id: str) -> Optional[ProfileModel]:
        """Return the profile for user_id, or None if it doesn't exist."""
        stmt = select(ProfileModel).where(ProfileModel.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, user_id: str, update_data: ProfileUpdate) -> ProfileModel:
        """
        Update a user's profile with the given data.

        Preconditions:
          - user_id identifies an existing profile row

        Postconditions:
          - Profile fields are updated; a subsequent GET returns the new values
          - Returns the updated ProfileModel
        """
        profile = await self.get_or_create(user_id)

        if update_data.display_name is not None:
            profile.display_name = update_data.display_name

        # Merge preference fields into the JSONB preferences column
        prefs = dict(profile.preferences or {})
        if update_data.dietary_preferences is not None:
            prefs["dietary_preferences"] = update_data.dietary_preferences
        if update_data.accessibility_needs is not None:
            prefs["accessibility_needs"] = update_data.accessibility_needs
        if update_data.default_travel_type is not None:
            prefs["default_travel_type"] = update_data.default_travel_type
        if update_data.default_travel_pace is not None:
            prefs["default_travel_pace"] = update_data.default_travel_pace
        if update_data.default_currency:
            prefs["default_currency"] = update_data.default_currency
        if update_data.default_accommodation_pref is not None:
            prefs["default_accommodation_pref"] = update_data.default_accommodation_pref

        profile.preferences = prefs

        await self.db.flush()
        await self.db.refresh(profile)
        return profile
