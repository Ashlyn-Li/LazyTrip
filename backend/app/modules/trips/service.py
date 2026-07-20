from app.modules.trips.schemas import NormalizedTripPreview, TripPreviewRequest


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
