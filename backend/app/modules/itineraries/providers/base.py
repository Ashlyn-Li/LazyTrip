from typing import Protocol

from app.modules.itineraries.schemas import GeneratedItinerary, ItineraryGenerationRequest


class ItineraryGenerator(Protocol):
    async def generate(self, request: ItineraryGenerationRequest) -> GeneratedItinerary:
        """Generate a validated itinerary draft."""
