from app.modules.itineraries.data.mock_itinerary import build_mock_itinerary
from app.modules.itineraries.schemas import GeneratedItinerary, ItineraryGenerationRequest


class FakeItineraryGenerator:
    def __init__(self, should_fail: bool = False) -> None:
        self.should_fail = should_fail

    async def generate(self, request: ItineraryGenerationRequest) -> GeneratedItinerary:
        if self.should_fail:
            raise RuntimeError("Simulated fake generator failure.")

        return build_mock_itinerary(request)
