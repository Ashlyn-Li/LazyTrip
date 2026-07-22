import asyncio
import logging
from threading import Thread

from app.config import get_settings
from app.modules.itineraries.errors import ItineraryProviderError
from app.modules.itineraries.job_store import ItineraryGenerationJob, ItineraryJobStore, job_store
from app.modules.itineraries.providers.base import ItineraryGenerator
from app.modules.itineraries.providers.factory import create_itinerary_generator
from app.modules.itineraries.schemas import ItineraryGenerationRequest
from app.modules.itineraries.validator import ItineraryValidationError, validate_generated_itinerary

logger = logging.getLogger(__name__)

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
        self.generator = generator or create_itinerary_generator(get_settings())
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
                fixed_events=request.fixed_events,
            )
            self.store.complete(job_id, itinerary)
        except ItineraryProviderError as error:
            self.store.fail(job_id, code=error.code, message=error.message)
        except ItineraryValidationError as error:
            logger.warning("Generated itinerary rejected by backend validation: %s", error)
            self.store.fail(
                job_id,
                code="llm_invalid_output",
                message="LazyTrip received an invalid itinerary draft. Please try again.",
            )
        except Exception:
            self.store.fail(
                job_id,
                code="itinerary_generation_failed",
                message="LazyTrip couldn't generate this draft. Please try again.",
            )


generation_service = ItineraryGenerationService()
