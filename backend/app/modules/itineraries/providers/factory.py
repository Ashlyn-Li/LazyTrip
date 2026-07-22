from app.config import ConfigurationError, Settings
from app.modules.itineraries.providers.base import ItineraryGenerator
from app.modules.itineraries.providers.fake import FakeItineraryGenerator
from app.modules.itineraries.providers.openai import OpenAIItineraryGenerator


def create_itinerary_generator(settings: Settings) -> ItineraryGenerator:
    if settings.itinerary_generator == "fake":
        return FakeItineraryGenerator()

    if settings.itinerary_generator == "openai":
        if not settings.openai_api_key or not settings.openai_model:
            raise ConfigurationError("OpenAI itinerary generation is missing required settings.")

        return OpenAIItineraryGenerator(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            model=settings.openai_model,
            max_output_tokens=settings.openai_max_output_tokens,
            request_timeout_seconds=settings.openai_request_timeout_seconds,
        )

    raise ConfigurationError("Unsupported itinerary generator configured.")
