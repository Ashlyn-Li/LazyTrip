from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.modules.trips.schemas import TripPreviewRequest, TripPreviewResponse
from app.modules.trips.service import TripPreviewError, create_trip_preview

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
