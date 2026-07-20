from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "lazytrip-api"}
    assert response.headers["content-type"].startswith("application/json")


def test_health_rejects_post() -> None:
    response = client.post("/api/v1/health")

    assert response.status_code != 200


def test_openapi_includes_health_route_and_schema() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200

    openapi_schema = response.json()
    assert "/api/v1/health" in openapi_schema["paths"]
    assert "HealthResponse" in openapi_schema["components"]["schemas"]
