"""
Database engine and session factory for the Travel Itinerary Planner.

Uses async SQLAlchemy with:
  - SQLite (aiosqlite) for local development (DATABASE_URL starts with sqlite)
  - PostgreSQL for production via Supabase (DATABASE_URL starts with postgresql)

The local SQLite database is created automatically on first startup.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.database.models import Base


def _build_engine():
    settings = get_settings()
    db_url = settings.database_url

    if db_url.startswith("sqlite"):
        # SQLite requires check_same_thread=False and StaticPool for async
        return create_async_engine(
            db_url,
            echo=False,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        return create_async_engine(db_url, echo=False, pool_pre_ping=True)


engine = _build_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Create all tables if they don't exist (local dev / test only)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Context manager that yields a database session and handles rollback on error."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session."""
    async with get_db_session() as session:
        yield session
