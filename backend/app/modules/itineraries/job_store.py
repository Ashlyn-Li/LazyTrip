from copy import deepcopy
from dataclasses import dataclass
from threading import Lock
from uuid import uuid4

from app.modules.itineraries.schemas import (
    GeneratedItinerary,
    GenerationJobError,
    GenerationStatus,
)


@dataclass
class ItineraryGenerationJob:
    job_id: str
    status: GenerationStatus
    progress: int
    message: str
    itinerary: GeneratedItinerary | None = None
    error: GenerationJobError | None = None


class ItineraryJobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, ItineraryGenerationJob] = {}
        self._lock = Lock()

    def create(self) -> ItineraryGenerationJob:
        job = ItineraryGenerationJob(
            job_id=str(uuid4()),
            status="queued",
            progress=0,
            message="Preparing your request",
        )
        with self._lock:
            self._jobs[job.job_id] = job
        return deepcopy(job)

    def get(self, job_id: str) -> ItineraryGenerationJob | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return deepcopy(job) if job else None

    def update(self, job_id: str, *, status: GenerationStatus, progress: int, message: str) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = status
            job.progress = max(job.progress, min(progress, 100))
            job.message = message

    def complete(self, job_id: str, itinerary: GeneratedItinerary) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = "completed"
            job.progress = 100
            job.message = "Your itinerary is ready"
            job.itinerary = itinerary
            job.error = None

    def fail(self, job_id: str, *, code: str, message: str) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = "failed"
            job.message = message
            job.error = GenerationJobError(code=code, message=message)


job_store = ItineraryJobStore()
