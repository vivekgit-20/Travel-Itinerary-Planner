"""
Security utilities for the Travel Itinerary Planner.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from jose import jwt


def create_test_token(user_id: str, secret: str = "test-secret", expires_in_hours: int = 1) -> str:
    """
    Create a JWT token for testing purposes.
    NEVER use this in production code.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "iat": now,
        "exp": now + timedelta(hours=expires_in_hours),
    }
    return jwt.encode(payload, secret, algorithm="HS256")
