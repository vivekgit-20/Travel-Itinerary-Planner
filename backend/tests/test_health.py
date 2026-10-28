"""Smoke tests for the health endpoint and CORS configuration."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"


def test_cors_headers_with_allowed_origin(client):
    """CORS preflight for the configured frontend origin should succeed."""
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    # FastAPI/Starlette returns 200 for OPTIONS when CORS middleware is active
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_headers_not_wildcard(client):
    """The CORS middleware must not expose a wildcard origin — only the configured one."""
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    acao = response.headers.get("access-control-allow-origin", "")
    assert acao != "*", "CORS must not use wildcard '*' — it should reflect the specific origin"


def test_cors_disallows_unknown_origin(client):
    """Requests from an un-configured origin must not receive an ACAO header."""
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://evil.example.com"},
    )
    acao = response.headers.get("access-control-allow-origin", "")
    assert acao != "http://evil.example.com", (
        "Unknown origins must not be echoed back in Access-Control-Allow-Origin"
    )
