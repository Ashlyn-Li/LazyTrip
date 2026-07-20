from pathlib import Path
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_TOKYO_REQUEST = {
    "origin": " London, United Kingdom ",
    "destination": " Tokyo, Japan ",
    "departure_date": "2026-10-10",
    "return_date": "2026-10-13",
    "adults": 2,
    "children": 0,
    "budget": 2500,
    "currency": "GBP",
}


def test_preview_valid_tokyo_trip_returns_normalized_response() -> None:
    response = client.post("/api/v1/trips/preview", json=VALID_TOKYO_REQUEST)

    assert response.status_code == 200
    response_body = response.json()
    assert UUID(response_body["session_id"])
    assert response_body == {
        "session_id": response_body["session_id"],
        "message": "Trip information is valid",
        "trip": {
            "origin": "London, United Kingdom",
            "destination": "Tokyo, Japan",
            "departure_date": "2026-10-10",
            "return_date": "2026-10-13",
            "duration_days": 3,
            "adults": 2,
            "children": 0,
            "total_travellers": 2,
            "budget": 2500,
            "currency": "GBP",
        },
    }


def test_preview_duration_and_total_travellers_are_derived() -> None:
    response = client.post(
        "/api/v1/trips/preview",
        json={**VALID_TOKYO_REQUEST, "return_date": "2026-10-15", "children": 2},
    )

    trip = response.json()["trip"]
    assert trip["duration_days"] == 5
    assert trip["total_travellers"] == 4


def test_preview_allows_missing_budget() -> None:
    payload = VALID_TOKYO_REQUEST.copy()
    payload.pop("budget")

    response = client.post("/api/v1/trips/preview", json=payload)

    assert response.status_code == 200
    assert response.json()["trip"]["budget"] is None


def test_preview_returns_a_unique_session_id_for_each_request() -> None:
    first_response = client.post("/api/v1/trips/preview", json=VALID_TOKYO_REQUEST)
    second_response = client.post("/api/v1/trips/preview", json=VALID_TOKYO_REQUEST)

    first_session_id = first_response.json()["session_id"]
    second_session_id = second_response.json()["session_id"]

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert UUID(first_session_id)
    assert UUID(second_session_id)
    assert first_session_id != second_session_id


@pytest.mark.parametrize(
    "payload_update",
    [
        {"return_date": "2026-10-09"},
        {"return_date": "2026-10-10"},
        {"origin": ""},
        {"origin": "   "},
        {"adults": 0},
        {"children": -1},
        {"adults": 20, "children": 1},
        {"budget": -1},
        {"currency": "CAD"},
    ],
)
def test_preview_rejects_invalid_structural_payloads(payload_update: dict[str, object]) -> None:
    response = client.post(
        "/api/v1/trips/preview",
        json={**VALID_TOKYO_REQUEST, **payload_update},
    )

    assert response.status_code == 422


def test_preview_rejects_origin_equal_to_destination_case_insensitively() -> None:
    response = client.post(
        "/api/v1/trips/preview",
        json={**VALID_TOKYO_REQUEST, "origin": " tokyo, japan ", "destination": "Tokyo, Japan"},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Origin and destination must be different."}


def test_preview_rejects_missing_required_fields() -> None:
    response = client.post("/api/v1/trips/preview", json={"origin": "London"})

    assert response.status_code == 422


def test_preview_rejects_unexpected_fields() -> None:
    response = client.post(
        "/api/v1/trips/preview",
        json={**VALID_TOKYO_REQUEST, "hotel_search": True},
    )

    assert response.status_code == 422


def test_preview_appears_in_openapi_schema() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200

    openapi_schema = response.json()
    assert "/api/v1/trips/preview" in openapi_schema["paths"]
    assert "TripPreviewRequest" in openapi_schema["components"]["schemas"]
    assert "TripPreviewResponse" in openapi_schema["components"]["schemas"]


def test_preview_creates_no_file_or_database_state() -> None:
    before_paths = {path for path in Path(".").iterdir()}

    response = client.post("/api/v1/trips/preview", json=VALID_TOKYO_REQUEST)

    after_paths = {path for path in Path(".").iterdir()}
    assert response.status_code == 200
    assert after_paths == before_paths
