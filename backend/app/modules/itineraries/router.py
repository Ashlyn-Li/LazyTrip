from fastapi import APIRouter, HTTPException, status

from app.modules.itineraries.job_store import job_store
from app.modules.itineraries.schemas import (
    ItineraryGenerationRequest,
    ItineraryGenerationStartResponse,
    ItineraryGenerationStatusResponse,
)
from app.modules.itineraries.service import generation_service

router = APIRouter(prefix="/itinerary-generations", tags=["itineraries"])


@router.post(
    "",
    response_model=ItineraryGenerationStartResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start fake itinerary generation",
)
async def start_itinerary_generation(
    request: ItineraryGenerationRequest,
) -> ItineraryGenerationStartResponse:
    job = generation_service.start(request)

    return ItineraryGenerationStartResponse(
        job_id=job.job_id,
        status=job.status,
        status_url=f"/api/v1/itinerary-generations/{job.job_id}",
    )


@router.get(
    "/{job_id}",
    response_model=ItineraryGenerationStatusResponse,
    summary="Get fake itinerary generation status",
)
def get_itinerary_generation(job_id: str) -> ItineraryGenerationStatusResponse:
    job = job_store.get(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation job not found.",
        )

    return ItineraryGenerationStatusResponse(
        job_id=job.job_id,
        status=job.status,
        progress=job.progress,
        message=job.message,
        itinerary=job.itinerary,
        error=job.error,
    )
