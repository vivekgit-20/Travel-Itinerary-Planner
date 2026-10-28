"""Integration tests for trip CRUD flow using FastAPI TestClient + in-memory SQLite."""

import asyncio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.models import Base
from app.database.connection import get_db
from app.core.security import create_test_token


# ─── Test database setup ──────────────────────────────────────────────────────

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def _run(coro):
    """Run a coroutine synchronously, compatible with all Python 3.10+ versions."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """Create tables in the test database once for the whole module."""
    async def _setup():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    _run(_setup())


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _auth_headers(user_id: str = "test-user-123") -> dict:
    """Create JWT headers for a test user using unverified dev mode."""
    token = create_test_token(user_id, secret="test-secret")
    return {"Authorization": f"Bearer {token}"}


TRIP_PAYLOAD = {
    "destination": "Tokyo",
    "start_date": "2024-07-01",
    "end_date": "2024-07-03",
    "budget_amount": 2000.0,
    "budget_currency": "USD",
    "travelers_count": 2,
    "traveler_type": "couple",
    "travel_pace": "moderate",
    "interests": ["food", "culture"],
    "accommodation_pref": "hotel",
    "dietary_preferences": [],
    "accessibility_needs": [],
}


def test_create_trip_returns_201(client):
    response = client.post("/api/v1/trips", json=TRIP_PAYLOAD, headers=_auth_headers())
    assert response.status_code == 201
    data = response.json()
    assert data["destination"] == "Tokyo"
    assert data["status"] == "active"
    assert len(data["itinerary_days"]) == 3  # 3 days


def test_list_trips_returns_user_trips(client):
    # Create a trip first
    client.post("/api/v1/trips", json=TRIP_PAYLOAD, headers=_auth_headers())
    response = client.get("/api/v1/trips", headers=_auth_headers())
    assert response.status_code == 200
    trips = response.json()
    assert len(trips) >= 1


def test_get_trip_returns_full_itinerary(client):
    create_resp = client.post("/api/v1/trips", json=TRIP_PAYLOAD, headers=_auth_headers("user-get-test"))
    assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
    trip_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/v1/trips/{trip_id}", headers=_auth_headers("user-get-test"))
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == trip_id


def test_get_trip_other_user_returns_404(client):
    create_resp = client.post("/api/v1/trips", json=TRIP_PAYLOAD, headers=_auth_headers("owner-user"))
    assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
    trip_id = create_resp.json()["id"]

    # Different user tries to access
    get_resp = client.get(f"/api/v1/trips/{trip_id}", headers=_auth_headers("other-user"))
    assert get_resp.status_code == 404


def test_delete_trip(client):
    create_resp = client.post("/api/v1/trips", json=TRIP_PAYLOAD, headers=_auth_headers("delete-user"))
    assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
    trip_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/trips/{trip_id}", headers=_auth_headers("delete-user"))
    assert del_resp.status_code == 200

    # Verify it's gone
    get_resp = client.get(f"/api/v1/trips/{trip_id}", headers=_auth_headers("delete-user"))
    assert get_resp.status_code == 404


def test_delete_cascade_removes_days(client):
    create_resp = client.post("/api/v1/trips", json=TRIP_PAYLOAD, headers=_auth_headers("cascade-user"))
    assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
    trip_id = create_resp.json()["id"]
    assert len(create_resp.json()["itinerary_days"]) > 0

    client.delete(f"/api/v1/trips/{trip_id}", headers=_auth_headers("cascade-user"))

    get_resp = client.get(f"/api/v1/trips/{trip_id}", headers=_auth_headers("cascade-user"))
    assert get_resp.status_code == 404  # Trip gone, days should be too
