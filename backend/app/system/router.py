from fastapi import APIRouter

from app.system.schemas import HealthResponse

router = APIRouter(tags=["system"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check API health",
)
def get_health() -> HealthResponse:
    return HealthResponse(status="ok", service="lazytrip-api")
