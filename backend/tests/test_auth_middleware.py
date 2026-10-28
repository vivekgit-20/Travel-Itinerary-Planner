"""Integration tests for JWT authentication middleware."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_test_token


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_does_not_require_auth(client):
    """Health endpoint should be accessible without a token."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_trips_requires_auth(client):
    """Trip listing must return 401 without a Bearer token."""
    response = client.get("/api/v1/trips")
    assert response.status_code == 401


def test_profile_requires_auth(client):
    """Profile endpoint must return 401 without a token."""
    response = client.get("/api/v1/profile")
    assert response.status_code == 401


def test_recommendations_requires_auth(client):
    """Recommendations endpoint must return 401 without a token."""
    response = client.post("/api/v1/recommendations", json={
        "interests": ["food"],
        "traveler_type": "solo",
        "budget_range": "budget",
        "trip_duration_days": 3,
    })
    assert response.status_code == 401


def test_malformed_token_returns_401(client):
    """A clearly invalid token must return 401."""
    response = client.get("/api/v1/trips", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


def test_valid_token_passes_auth(client):
    """A valid (dev) token should let the request reach the route and return 200."""
    token = create_test_token("test-user-456", secret="test-secret")
    response = client.get("/api/v1/trips", headers={"Authorization": f"Bearer {token}"})
    # Should get 200 (empty list), not 401
    assert response.status_code == 200
