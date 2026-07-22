import asyncio

from fastapi.testclient import TestClient

from app.main import app
from app.modules.itineraries.data.mock_itinerary import build_mock_itinerary
from app.modules.itineraries.providers.fake import FakeItineraryGenerator
from app.modules.itineraries.schemas import ItineraryGenerationRequest
from app.modules.itineraries.service import generation_service
from app.modules.itineraries.validator import ItineraryValidationError, validate_generated_itinerary

client = TestClient(app)
generation_service.stage_delay_seconds = 0.01

VALID_GENERATION_REQUEST = {
    "trip": {
        "origin": "London, United Kingdom",
        "destination": "Tokyo, Japan",
        "departure_date": "2026-09-12",
        "return_date": "2026-09-15",
        "adults": 2,
        "children": 0,
        "budget": 5000,
        "currency": "GBP",
    },
    "preferences": {
        "pace": "balanced",
        "interests": ["food", "local-culture"],
        "explorationStyle": "independent-with-guides",
        "transportModes": ["walking", "public-transport"],
        "accommodationStyle": "boutique",
        "preferredStartTime": "10:00",
        "freeTimeLevel": "some",
        "guidePreference": "small-group",
        "guidedActivityTypes": ["food-tour"],
        "dietaryRequirements": "",
        "accessibilityRequirements": "",
        "mustSeePlaces": "teamLab Planets",
        "thingsToAvoid": "",
        "additionalComments": "teamLab Planets on day 2 at 1 PM",
    },
    "fixedEvents": [
        {
            "id": "d2-teamlab",
            "title": "teamLab Planets",
            "date": "2026-09-13",
            "startTime": "13:00",
            "endTime": "15:00",
            "location": "Toyosu",
        }
    ],
}


def test_start_generation_returns_accepted_job() -> None:
    response = client.post("/api/v1/itinerary-generations", json=VALID_GENERATION_REQUEST)

    assert response.status_code == 202
    body = response.json()
    assert body["job_id"]
    assert body["status"] == "queued"
    assert body["status_url"] == f"/api/v1/itinerary-generations/{body['job_id']}"


def test_status_endpoint_returns_progress_and_completes() -> None:
    response = client.post("/api/v1/itinerary-generations", json=VALID_GENERATION_REQUEST)
    job_id = response.json()["job_id"]
    previous_progress = 0
    final_body = None

    for _ in range(20):
        status_response = client.get(f"/api/v1/itinerary-generations/{job_id}")
        body = status_response.json()
        assert status_response.status_code == 200
        assert body["progress"] >= previous_progress
        previous_progress = body["progress"]

        if body["status"] == "completed":
            final_body = body
            break

        asyncio.run(asyncio.sleep(0.02))

    assert final_body is not None
    assert final_body["progress"] == 100
    assert final_body["itinerary"]["status"] == "mock"
    fixed_item = next(
        item for item in final_body["itinerary"]["days"][1]["items"] if item["id"] == "d2-teamlab"
    )
    assert fixed_item["isFixed"] is True


def test_unknown_generation_job_returns_404() -> None:
    response = client.get("/api/v1/itinerary-generations/missing")

    assert response.status_code == 404


def test_generation_rejects_invalid_payloads() -> None:
    response = client.post(
        "/api/v1/itinerary-generations",
        json={**VALID_GENERATION_REQUEST, "prompt": "Write anything"},
    )

    assert response.status_code == 422


def test_generation_rejects_invalid_trip() -> None:
    payload = {
        **VALID_GENERATION_REQUEST,
        "trip": {**VALID_GENERATION_REQUEST["trip"], "return_date": "2026-09-12"},
    }

    response = client.post("/api/v1/itinerary-generations", json=payload)

    assert response.status_code == 422


def test_generation_rejects_invalid_preferences() -> None:
    payload = {
        **VALID_GENERATION_REQUEST,
        "preferences": {**VALID_GENERATION_REQUEST["preferences"], "interests": []},
    }

    response = client.post("/api/v1/itinerary-generations", json=payload)

    assert response.status_code == 422


def test_validator_rejects_duplicate_item_ids() -> None:
    request = ItineraryGenerationRequest.model_validate(VALID_GENERATION_REQUEST)
    itinerary = build_mock_itinerary(request)
    itinerary.days[0].items[1].id = itinerary.days[0].items[0].id

    try:
        validate_generated_itinerary(
            itinerary,
            start_date=request.trip.departure_date,
            return_date=request.trip.return_date,
            fixed_events=request.fixed_events,
        )
    except ItineraryValidationError:
        return

    raise AssertionError("Expected duplicate item IDs to be rejected.")


def test_validator_rejects_overlapping_activities() -> None:
    request = ItineraryGenerationRequest.model_validate(VALID_GENERATION_REQUEST)
    itinerary = build_mock_itinerary(request)
    first_activity = itinerary.days[0].items[0]
    second_activity = itinerary.days[0].items[2]
    assert first_activity.type != "travel"
    assert second_activity.type != "travel"
    second_activity.start_time = first_activity.start_time
    second_activity.end_time = first_activity.end_time

    try:
        validate_generated_itinerary(
            itinerary,
            start_date=request.trip.departure_date,
            return_date=request.trip.return_date,
            fixed_events=request.fixed_events,
        )
    except ItineraryValidationError:
        return

    raise AssertionError("Expected overlapping activities to be rejected.")


def test_fake_provider_requires_no_network() -> None:
    request = ItineraryGenerationRequest.model_validate(VALID_GENERATION_REQUEST)
    itinerary = asyncio.run(FakeItineraryGenerator().generate(request))

    assert itinerary.status == "mock"
    assert itinerary.destination == "Tokyo, Japan"


def test_provider_failure_marks_job_failed() -> None:
    original_generator = generation_service.generator
    generation_service.generator = FakeItineraryGenerator(should_fail=True)

    try:
        response = client.post("/api/v1/itinerary-generations", json=VALID_GENERATION_REQUEST)
        job_id = response.json()["job_id"]
        final_body = None

        for _ in range(20):
            status_response = client.get(f"/api/v1/itinerary-generations/{job_id}")
            body = status_response.json()
            if body["status"] == "failed":
                final_body = body
                break
            asyncio.run(asyncio.sleep(0.02))

        assert final_body is not None
        assert final_body["error"]["code"] == "itinerary_generation_failed"
        assert final_body["itinerary"] is None
    finally:
        generation_service.generator = original_generator


def test_validator_rejects_missing_mock_label() -> None:
    request = ItineraryGenerationRequest.model_validate(VALID_GENERATION_REQUEST)
    itinerary = build_mock_itinerary(request)
    itinerary.data_status_label = "Generated itinerary"

    try:
        validate_generated_itinerary(
            itinerary,
            start_date=request.trip.departure_date,
            return_date=request.trip.return_date,
            fixed_events=request.fixed_events,
        )
    except ItineraryValidationError:
        return

    raise AssertionError("Expected missing mock label to be rejected.")
