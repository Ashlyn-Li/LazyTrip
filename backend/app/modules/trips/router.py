from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.modules.trips.schemas import (
    TripPreferencesPreviewRequest,
    TripPreferencesPreviewResponse,
    TripPreviewRequest,
    TripPreviewResponse,
)
from app.modules.trips.service import (
    TripPreviewError,
    create_preferences_preview,
    create_trip_preview,
)

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post(
    "/preview",
    response_model=TripPreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Preview validated trip details",
    description=(
        "Validate homepage trip-search details, normalize text fields, and return derived "
        "values without saving anything."
    ),
)
def preview_trip(request: TripPreviewRequest) -> TripPreviewResponse:
    try:
        trip_preview = create_trip_preview(request)
    except TripPreviewError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return TripPreviewResponse(
        session_id=str(uuid4()),
        message="Trip information is valid",
        trip=trip_preview,
    )


@router.post(
    "/preferences/preview",
    response_model=TripPreferencesPreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Preview validated trip preferences",
)
def preview_trip_preferences(
    request: TripPreferencesPreviewRequest,
) -> TripPreferencesPreviewResponse:
    preferences, summary = create_preferences_preview(request)

    return TripPreferencesPreviewResponse(
        message="Trip preferences are valid",
        preferences=preferences,
        summary=summary,
    )
