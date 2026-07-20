# ruff: noqa: E501

from copy import deepcopy
from datetime import timedelta
from typing import cast

from app.modules.itineraries.schemas import GeneratedItinerary, ItineraryGenerationRequest
from app.modules.trips.service import create_trip_preview

BASE_TOKYO_ITINERARY = {
    "id": "tokyo-generated-mock",
    "status": "mock",
    "title": "Three-day Tokyo discovery",
    "destination": "Tokyo, Japan",
    "summary": "A mock Tokyo draft built from your validated trip and preferences. Live places, opening hours, routes, hotels, and prices have not been checked.",
    "timeZone": "Asia/Tokyo",
    "dataStatusLabel": "Generated mock itinerary - unverified",
    "hotelPlaceholder": "Boutique hotel base in central Tokyo, exact property to be selected later.",
    "days": [
        {
            "dayNumber": 1,
            "date": "2026-09-12",
            "title": "Shibuya, shrines, and evening food",
            "summary": "A balanced first day moving from Shibuya energy to Meiji Shrine calm.",
            "items": [
                {
                    "id": "d1-arrival",
                    "type": "free-time",
                    "title": "Arrival or relaxed start",
                    "description": "Ease into the city and get oriented.",
                    "location": "Central Tokyo",
                    "startTime": "10:00",
                    "endTime": "11:00",
                    "isFixed": False,
                    "bookingStatus": "not-required",
                },
                {
                    "id": "d1-travel-1",
                    "type": "travel",
                    "transportMode": "public-transport",
                    "durationMinutes": 25,
                    "description": "Mock local rail transfer. Routing has not been verified.",
                },
                {
                    "id": "d1-shibuya",
                    "type": "activity",
                    "title": "Shibuya crossing and neighbourhood wander",
                    "description": "Explore Shibuya, shops, and photo spots.",
                    "location": "Shibuya",
                    "startTime": "11:30",
                    "endTime": "13:00",
                    "cost": {
                        "amount": 0,
                        "currency": "JPY",
                        "convertedAmount": 0,
                        "convertedCurrency": "GBP",
                        "status": "estimated",
                    },
                    "isFixed": False,
                    "bookingStatus": "not-required",
                },
                {
                    "id": "d1-food-tour",
                    "type": "guided-experience",
                    "title": "Small-group evening food tour",
                    "description": "Mock guided tasting walk. Availability has not been checked.",
                    "location": "Shinjuku or Shibuya",
                    "startTime": "18:30",
                    "endTime": "21:00",
                    "cost": {
                        "amount": 28000,
                        "currency": "JPY",
                        "convertedAmount": 150,
                        "convertedCurrency": "GBP",
                        "status": "mock",
                    },
                    "isFixed": False,
                    "bookingStatus": "recommended",
                },
            ],
        },
        {
            "dayNumber": 2,
            "date": "2026-09-13",
            "title": "Market morning, fixed art booking, and Ginza",
            "summary": "Food-focused morning, fixed teamLab Planets visit, then Ginza.",
            "items": [
                {
                    "id": "d2-tsukiji",
                    "type": "meal",
                    "title": "Tsukiji Outer Market breakfast",
                    "description": "Sample market snacks. Opening hours have not been verified.",
                    "location": "Tsukiji Outer Market",
                    "startTime": "10:00",
                    "endTime": "12:00",
                    "cost": {
                        "amount": 7000,
                        "currency": "JPY",
                        "convertedAmount": 38,
                        "convertedCurrency": "GBP",
                        "status": "estimated",
                    },
                    "isFixed": False,
                    "bookingStatus": "not-required",
                },
                {
                    "id": "d2-travel-1",
                    "type": "travel",
                    "transportMode": "public-transport",
                    "durationMinutes": 30,
                    "description": "Mock transfer toward Toyosu.",
                },
                {
                    "id": "d2-teamlab",
                    "type": "activity",
                    "title": "teamLab Planets",
                    "description": "Fixed immersive art booking. Keep this time protected.",
                    "location": "Toyosu",
                    "startTime": "13:00",
                    "endTime": "15:00",
                    "cost": {
                        "amount": 7600,
                        "currency": "JPY",
                        "convertedAmount": 41,
                        "convertedCurrency": "GBP",
                        "status": "mock",
                    },
                    "isFixed": True,
                    "bookingStatus": "booked",
                },
                {
                    "id": "d2-ginza",
                    "type": "activity",
                    "title": "Ginza shops and design stops",
                    "description": "Browse department stores, design shops, and cafes.",
                    "location": "Ginza",
                    "startTime": "15:45",
                    "endTime": "18:00",
                    "cost": {
                        "amount": 0,
                        "currency": "JPY",
                        "convertedAmount": 0,
                        "convertedCurrency": "GBP",
                        "status": "estimated",
                    },
                    "isFixed": False,
                    "bookingStatus": "not-required",
                },
            ],
        },
        {
            "dayNumber": 3,
            "date": "2026-09-14",
            "title": "Asakusa, classic Tokyo, and final shopping",
            "summary": "Traditional Asakusa, Senso-ji, then a flexible afternoon.",
            "items": [
                {
                    "id": "d3-asakusa",
                    "type": "activity",
                    "title": "Asakusa and Senso-ji",
                    "description": "Visit Senso-ji and surrounding lanes.",
                    "location": "Asakusa",
                    "startTime": "10:00",
                    "endTime": "12:30",
                    "cost": {
                        "amount": 0,
                        "currency": "JPY",
                        "convertedAmount": 0,
                        "convertedCurrency": "GBP",
                        "status": "estimated",
                    },
                    "isFixed": False,
                    "bookingStatus": "not-required",
                },
                {
                    "id": "d3-lunch",
                    "type": "meal",
                    "title": "Tempura or soba lunch",
                    "description": "A simple mock lunch near Asakusa.",
                    "location": "Asakusa",
                    "startTime": "12:30",
                    "endTime": "13:30",
                    "cost": {
                        "amount": 5500,
                        "currency": "JPY",
                        "convertedAmount": 30,
                        "convertedCurrency": "GBP",
                        "status": "estimated",
                    },
                    "isFixed": False,
                    "bookingStatus": "not-required",
                },
                {
                    "id": "d3-ueno-akiba",
                    "type": "activity",
                    "title": "Ueno or Akihabara afternoon",
                    "description": "Choose parks/culture or shops based on energy.",
                    "location": "Ueno or Akihabara",
                    "startTime": "14:00",
                    "endTime": "17:00",
                    "cost": {
                        "amount": 3000,
                        "currency": "JPY",
                        "convertedAmount": 16,
                        "convertedCurrency": "GBP",
                        "status": "estimated",
                    },
                    "isFixed": False,
                    "bookingStatus": "not-required",
                },
            ],
        },
    ],
    "costSummary": {
        "accommodation": {
            "amount": 90000,
            "currency": "JPY",
            "convertedAmount": 486,
            "convertedCurrency": "GBP",
            "status": "mock",
        },
        "food": {
            "amount": 65000,
            "currency": "JPY",
            "convertedAmount": 351,
            "convertedCurrency": "GBP",
            "status": "estimated",
        },
        "activities": {
            "amount": 38600,
            "currency": "JPY",
            "convertedAmount": 209,
            "convertedCurrency": "GBP",
            "status": "mock",
        },
        "localTransport": {
            "amount": 12000,
            "currency": "JPY",
            "convertedAmount": 65,
            "convertedCurrency": "GBP",
            "status": "estimated",
        },
        "total": {
            "amount": 205600,
            "currency": "JPY",
            "convertedAmount": 1111,
            "convertedCurrency": "GBP",
            "status": "estimated",
        },
    },
    "notes": [
        "Mock generation only.",
        "Prices are estimates.",
        "Availability, routes, and opening hours have not been checked.",
    ],
}


def build_mock_itinerary(request: ItineraryGenerationRequest) -> GeneratedItinerary:
    trip = create_trip_preview(request.trip)
    itinerary_data = deepcopy(BASE_TOKYO_ITINERARY)
    itinerary_data["id"] = f"mock-{trip.destination.lower().replace(' ', '-').replace(',', '')}"
    itinerary_data["destination"] = trip.destination
    itinerary_data["title"] = f"{trip.duration_days}-day {trip.destination} discovery"

    base_days = cast(list[dict[str, object]], itinerary_data["days"])
    generated_days: list[dict[str, object]] = []

    for day_offset in range(trip.duration_days):
        day = deepcopy(base_days[day_offset % len(base_days)])
        day["dayNumber"] = day_offset + 1
        day["date"] = str(trip.departure_date + timedelta(days=day_offset))
        if day_offset >= len(base_days):
            day["title"] = f"Flexible mock day {day_offset + 1}"
            day["summary"] = "A repeated mock planning day. Live data has not been checked."
            day["items"] = _clone_items_for_extra_day(day, day_offset + 1)
        generated_days.append(day)

    itinerary_data["days"] = generated_days
    return GeneratedItinerary.model_validate(itinerary_data)


def _clone_items_for_extra_day(day: dict[str, object], day_number: int) -> list[dict[str, object]]:
    items = cast(list[dict[str, object]], day["items"])
    cloned_items = deepcopy(items)

    for index, item in enumerate(cloned_items):
        item["id"] = f"d{day_number}-mock-{index + 1}"
        if item.get("isFixed") is True:
            item["isFixed"] = False
            item["bookingStatus"] = "not-required"

    return cloned_items
