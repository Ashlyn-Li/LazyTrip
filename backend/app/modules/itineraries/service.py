import asyncio
from threading import Thread

from app.modules.itineraries.job_store import ItineraryGenerationJob, ItineraryJobStore, job_store
from app.modules.itineraries.providers.base import ItineraryGenerator
from app.modules.itineraries.providers.fake import FakeItineraryGenerator
from app.modules.itineraries.schemas import ItineraryGenerationRequest
from app.modules.itineraries.validator import validate_generated_itinerary

STAGES = [
    ("validating", 15, "Checking your trip details"),
    ("collecting_data", 35, "Preparing mock destination information"),
    ("generating", 60, "Building your daily itinerary"),
    ("validating_output", 85, "Checking your itinerary"),
]


class ItineraryGenerationService:
    def __init__(
        self,
        store: ItineraryJobStore = job_store,
        generator: ItineraryGenerator | None = None,
        stage_delay_seconds: float = 1.1,
    ) -> None:
        self.store = store
        self.generator = generator or FakeItineraryGenerator()
        self.stage_delay_seconds = stage_delay_seconds

    def start(self, request: ItineraryGenerationRequest) -> ItineraryGenerationJob:
        job = self.store.create()
        Thread(
            target=lambda: asyncio.run(self._run(job.job_id, request)),
            daemon=True,
        ).start()
        return job

    async def _run(self, job_id: str, request: ItineraryGenerationRequest) -> None:
        try:
            for status, progress, message in STAGES:
                await asyncio.sleep(self.stage_delay_seconds)
                self.store.update(job_id, status=status, progress=progress, message=message)

            itinerary = await self.generator.generate(request)
            validate_generated_itinerary(
                itinerary,
                start_date=request.trip.departure_date,
                return_date=request.trip.return_date,
            )
            self.store.complete(job_id, itinerary)
        except Exception:
            self.store.fail(job_id, "ITINERARY_GENERATION_FAILED")


generation_service = ItineraryGenerationService()
