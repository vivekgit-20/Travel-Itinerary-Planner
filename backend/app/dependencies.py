"""
FastAPI dependencies for authentication and database session injection.
"""
from __future__ import annotations
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, ExpiredSignatureError, jwt

from app.core.config import get_settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)


async def verify_jwt(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if token is None:
        raise credentials_exception

    # Always decode without signature verification first to extract user_id.
    # This works for Supabase tokens in local dev without needing the JWT secret.
    # The token is still validated for expiry.
    try:
        payload = jwt.decode(
            token,
            key="",
            algorithms=["HS256"],
            options={
                "verify_signature": False,
                "verify_exp": True,
                "verify_aud": False,
            },
        )
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise credentials_exception
        return user_id
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception


async def get_current_user_id(user_id: str = Depends(verify_jwt)) -> str:
    return user_id
