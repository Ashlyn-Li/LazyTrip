from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_PREFERENCES_REQUEST = {
    "pace": "balanced",
    "interests": ["food", "local-culture", "photography", "shopping"],
    "explorationStyle": "independent-with-guides",
    "transportModes": ["walking", "public-transport"],
    "accommodationStyle": "boutique",
    "preferredStartTime": "10:00",
    "freeTimeLevel": "some",
    "guidePreference": "small-group",
    "guidedActivityTypes": ["food-tour", "culture-history-tour"],
    "dietaryRequirements": " vegetarian options ",
    "accessibilityRequirements": "",
    "mustSeePlaces": " teamLab Planets ",
    "thingsToAvoid": " crowded clubs ",
    "additionalComments": " teamLab Planets on day 2 at 1 PM ",
}


def test_preferences_preview_valid_complete_request_returns_normalized_response() -> None:
    response = client.post("/api/v1/trips/preferences/preview", json=VALID_PREFERENCES_REQUEST)

    assert response.status_code == 200
    assert response.json() == {
        "message": "Trip preferences are valid",
        "preferences": {
            "pace": "balanced",
            "interests": ["food", "local-culture", "photography", "shopping"],
            "explorationStyle": "independent-with-guides",
            "transportModes": ["walking", "public-transport"],
            "accommodationStyle": "boutique",
            "preferredStartTime": "10:00",
            "freeTimeLevel": "some",
            "guidePreference": "small-group",
            "guidedActivityTypes": ["food-tour", "culture-history-tour"],
            "dietaryRequirements": "vegetarian options",
            "accessibilityRequirements": "",
            "mustSeePlaces": "teamLab Planets",
            "thingsToAvoid": "crowded clubs",
            "additionalComments": "teamLab Planets on day 2 at 1 PM",
        },
        "summary": {
            "interest_count": 4,
            "uses_guided_experiences": True,
        },
    }


def test_preferences_preview_interest_count_uses_deduplicated_interests() -> None:
    response = client.post(
        "/api/v1/trips/preferences/preview",
        json={**VALID_PREFERENCES_REQUEST, "interests": ["food", "food", "history"]},
    )

    assert response.status_code == 200
    assert response.json()["preferences"]["interests"] == ["food", "history"]
    assert response.json()["summary"]["interest_count"] == 2


@pytest.mark.parametrize(
    ("payload_update", "expected_flag"),
    [
        ({"explorationStyle": "mostly-independent", "guidePreference": "small-group"}, False),
        ({"explorationStyle": "mostly-guided", "guidePreference": "private-guide"}, True),
    ],
)
def test_preferences_preview_guided_experience_flag(
    payload_update: dict[str, object], expected_flag: bool
) -> None:
    response = client.post(
        "/api/v1/trips/preferences/preview",
        json={**VALID_PREFERENCES_REQUEST, **payload_update},
    )

    assert response.status_code == 200
    assert response.json()["summary"]["uses_guided_experiences"] is expected_flag


@pytest.mark.parametrize(
    "payload_update",
    [
        {"interests": []},
        {"interests": ["food", "unsupported"]},
        {"pace": "rushed"},
        {"explorationStyle": "driver-only"},
        {"explorationStyle": "mostly-guided", "guidePreference": None},
        {"transportModes": []},
        {"transportModes": ["walking", "helicopter"]},
        {"preferredStartTime": "10am"},
        {"additionalComments": "x" * 1001},
        {"surpriseField": True},
    ],
)
def test_preferences_preview_rejects_invalid_payloads(payload_update: dict[str, object]) -> None:
    response = client.post(
        "/api/v1/trips/preferences/preview",
        json={**VALID_PREFERENCES_REQUEST, **payload_update},
    )

    assert response.status_code == 422


def test_preferences_preview_fully_independent_normalizes_guided_fields() -> None:
    response = client.post(
        "/api/v1/trips/preferences/preview",
        json={
            **VALID_PREFERENCES_REQUEST,
            "explorationStyle": "mostly-independent",
            "guidePreference": "small-group",
            "guidedActivityTypes": ["food-tour"],
        },
    )

    preferences = response.json()["preferences"]
    assert response.status_code == 200
    assert preferences["guidePreference"] is None
    assert preferences["guidedActivityTypes"] == []


def test_preferences_preview_deduplicates_transport_modes_without_sorting() -> None:
    response = client.post(
        "/api/v1/trips/preferences/preview",
        json={
            **VALID_PREFERENCES_REQUEST,
            "transportModes": ["taxi", "walking", "taxi", "public-transport"],
        },
    )

    assert response.status_code == 200
    assert response.json()["preferences"]["transportModes"] == [
        "taxi",
        "walking",
        "public-transport",
    ]


def test_preferences_preview_normalizes_whitespace_only_text_to_empty_strings() -> None:
    response = client.post(
        "/api/v1/trips/preferences/preview",
        json={
            **VALID_PREFERENCES_REQUEST,
            "dietaryRequirements": "   ",
            "accessibilityRequirements": "   ",
            "mustSeePlaces": "   ",
            "thingsToAvoid": "   ",
            "additionalComments": "   ",
        },
    )

    preferences = response.json()["preferences"]
    assert response.status_code == 200
    assert preferences["dietaryRequirements"] == ""
    assert preferences["accessibilityRequirements"] == ""
    assert preferences["mustSeePlaces"] == ""
    assert preferences["thingsToAvoid"] == ""
    assert preferences["additionalComments"] == ""


def test_preferences_preview_appears_in_openapi_schema() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200

    openapi_schema = response.json()
    assert "/api/v1/trips/preferences/preview" in openapi_schema["paths"]
    assert "TripPreferencesPreviewRequest" in openapi_schema["components"]["schemas"]
    assert "TripPreferencesPreviewResponse" in openapi_schema["components"]["schemas"]


def test_preferences_preview_creates_no_file_or_database_state() -> None:
    before_paths = {path for path in Path(".").iterdir()}

    response = client.post("/api/v1/trips/preferences/preview", json=VALID_PREFERENCES_REQUEST)

    after_paths = {path for path in Path(".").iterdir()}
    assert response.status_code == 200
    assert after_paths == before_paths
