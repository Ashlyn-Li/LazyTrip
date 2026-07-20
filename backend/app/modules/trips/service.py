from app.modules.trips.schemas import (
    NormalizedTripPreferencesPreview,
    NormalizedTripPreview,
    TripPreferencesPreviewRequest,
    TripPreferencesPreviewSummary,
    TripPreviewRequest,
)


class TripPreviewError(ValueError):
    """Raised when trip preview business rules fail."""


def create_trip_preview(request: TripPreviewRequest) -> NormalizedTripPreview:
    origin = request.origin.strip()
    destination = request.destination.strip()

    if origin.casefold() == destination.casefold():
        raise TripPreviewError("Origin and destination must be different.")

    duration_days = (request.return_date - request.departure_date).days
    total_travellers = request.adults + request.children

    return NormalizedTripPreview(
        origin=origin,
        destination=destination,
        departure_date=request.departure_date,
        return_date=request.return_date,
        duration_days=duration_days,
        adults=request.adults,
        children=request.children,
        total_travellers=total_travellers,
        budget=request.budget,
        currency=request.currency,
    )


def deduplicate_preserving_order[Item: str](items: list[Item]) -> list[Item]:
    seen_items: set[Item] = set()
    normalized_items: list[Item] = []

    for item in items:
        if item in seen_items:
            continue

        seen_items.add(item)
        normalized_items.append(item)

    return normalized_items


def normalize_text(value: str) -> str:
    return value.strip()


def create_preferences_preview(
    request: TripPreferencesPreviewRequest,
) -> tuple[NormalizedTripPreferencesPreview, TripPreferencesPreviewSummary]:
    uses_guided_experiences = request.exploration_style != "mostly-independent"
    interests = deduplicate_preserving_order(request.interests)
    transport_modes = deduplicate_preserving_order(request.transport_modes)
    guided_activity_types = (
        deduplicate_preserving_order(request.guided_activity_types)
        if uses_guided_experiences
        else []
    )

    preferences = NormalizedTripPreferencesPreview(
        pace=request.pace,
        interests=interests,
        exploration_style=request.exploration_style,
        transport_modes=transport_modes,
        accommodation_style=request.accommodation_style,
        preferred_start_time=request.preferred_start_time,
        free_time_level=request.free_time_level,
        guide_preference=request.guide_preference if uses_guided_experiences else None,
        guided_activity_types=guided_activity_types,
        dietary_requirements=normalize_text(request.dietary_requirements),
        accessibility_requirements=normalize_text(request.accessibility_requirements),
        must_see_places=normalize_text(request.must_see_places),
        things_to_avoid=normalize_text(request.things_to_avoid),
        additional_comments=normalize_text(request.additional_comments),
    )
    summary = TripPreferencesPreviewSummary(
        interest_count=len(interests),
        uses_guided_experiences=uses_guided_experiences,
    )

    return preferences, summary
