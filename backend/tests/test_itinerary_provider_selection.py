import pytest

from app.config import ConfigurationError, Settings
from app.modules.itineraries.providers import factory
from app.modules.itineraries.providers.fake import FakeItineraryGenerator


class SelectedOpenAIGenerator:
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str | None,
        model: str,
        max_output_tokens: int,
        request_timeout_seconds: float,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.max_output_tokens = max_output_tokens
        self.request_timeout_seconds = request_timeout_seconds


def test_fake_configuration_selects_fake_provider() -> None:
    settings = Settings(itinerary_generator="fake")

    generator = factory.create_itinerary_generator(settings)

    assert isinstance(generator, FakeItineraryGenerator)


def test_fake_configuration_requires_no_openai_key() -> None:
    settings = Settings(itinerary_generator="fake", openai_api_key=None, openai_model=None)

    generator = factory.create_itinerary_generator(settings)

    assert isinstance(generator, FakeItineraryGenerator)


def test_openai_configuration_selects_real_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(factory, "OpenAIItineraryGenerator", SelectedOpenAIGenerator)
    settings = Settings(
        itinerary_generator="openai",
        openai_api_key="test-key",
        openai_model="test-model",
        openai_max_output_tokens=1000,
        openai_request_timeout_seconds=10,
    )

    generator = factory.create_itinerary_generator(settings)

    assert isinstance(generator, SelectedOpenAIGenerator)
    assert generator.model == "test-model"


def test_openai_configuration_without_key_fails_safely() -> None:
    with pytest.raises(ConfigurationError) as error:
        Settings(itinerary_generator="openai", openai_api_key=None, openai_model="test-model")

    assert "OPENAI_API_KEY" in str(error.value)
    assert "test-key" not in str(error.value)


def test_unsupported_provider_name_fails() -> None:
    with pytest.raises(ValueError):
        Settings(itinerary_generator="unsupported")
