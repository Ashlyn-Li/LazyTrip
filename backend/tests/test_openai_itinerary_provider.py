import asyncio
import json
from types import SimpleNamespace

from app.modules.itineraries.data.mock_itinerary import build_mock_itinerary
from app.modules.itineraries.errors import ItineraryProviderError
from app.modules.itineraries.providers.openai import OpenAIItineraryGenerator
from app.modules.itineraries.schemas import GeneratedItinerary, ItineraryGenerationRequest
from tests.test_itinerary_generation import VALID_GENERATION_REQUEST


class FakeCompletions:
    def __init__(self, results: list[object]) -> None:
        self.results = results
        self.calls = 0
        self.last_kwargs: dict[str, object] = {}

    def create(self, **kwargs: object) -> object:
        self.calls += 1
        self.last_kwargs = kwargs
        result = self.results.pop(0)

        if isinstance(result, Exception):
            raise result

        return result


class FakeClient:
    def __init__(self, completions: FakeCompletions) -> None:
        self.chat = SimpleNamespace(completions=completions)


class AuthenticationFailureError(Exception):
    status_code = 401


class RateLimitFailureError(Exception):
    status_code = 429


class TemporaryProviderFailureError(Exception):
    status_code = 503


class GatewayTimeoutError(Exception):
    status_code = 408


def _request() -> ItineraryGenerationRequest:
    return ItineraryGenerationRequest.model_validate(VALID_GENERATION_REQUEST)


def _real_like_itinerary() -> GeneratedItinerary:
    itinerary = build_mock_itinerary(_request())
    data = itinerary.model_dump(mode="json", by_alias=True)
    data["status"] = "generated"
    data["provider"] = "openai"
    data["dataStatusLabel"] = "AI-generated draft - unverified"
    return GeneratedItinerary.model_validate(data)


def _response(
    content: str | None,
    *,
    finish_reason: str = "stop",
    refusal: str | None = None,
) -> object:
    message = SimpleNamespace(content=content, refusal=refusal)
    choice = SimpleNamespace(message=message, finish_reason=finish_reason)
    return SimpleNamespace(choices=[choice])


def _generator(completions: FakeCompletions) -> OpenAIItineraryGenerator:
    return OpenAIItineraryGenerator(
        api_key="secret-key",
        model="@personal-openai/test-model",
        max_output_tokens=1200,
        request_timeout_seconds=10,
        client=FakeClient(completions),
    )


def test_valid_structured_output_succeeds() -> None:
    itinerary = _real_like_itinerary()
    completions = FakeCompletions([_response(itinerary.model_dump_json(by_alias=True))])

    result = asyncio.run(_generator(completions).generate(_request()))

    assert result.provider == "openai"
    assert result.status == "generated"
    assert completions.calls == 1
    assert completions.last_kwargs["model"] == "@personal-openai/test-model"
    messages = completions.last_kwargs["messages"]
    assert isinstance(messages, list)
    assert messages[0]["role"] == "system"
    response_format = completions.last_kwargs["response_format"]
    assert response_format["type"] == "json_schema"
    assert response_format["json_schema"]["strict"] is True
    serialized_schema = json.dumps(response_format["json_schema"]["schema"])
    assert '"oneOf"' not in serialized_schema
    assert '"discriminator"' not in serialized_schema
    assert '"anyOf"' in serialized_schema


def test_timeout_maps_safely_and_retries_once() -> None:
    completions = FakeCompletions([TimeoutError("secret-key"), TimeoutError("secret-key")])

    try:
        asyncio.run(_generator(completions).generate(_request()))
    except ItineraryProviderError as error:
        assert error.code == "llm_timeout"
        assert "secret-key" not in error.message
        assert completions.calls == 2
        return

    raise AssertionError("Expected timeout failure.")


def test_gateway_408_maps_to_timeout_and_retries_once() -> None:
    completions = FakeCompletions([GatewayTimeoutError(), GatewayTimeoutError()])

    try:
        asyncio.run(_generator(completions).generate(_request()))
    except ItineraryProviderError as error:
        assert error.code == "llm_timeout"
        assert completions.calls == 2
        return

    raise AssertionError("Expected gateway timeout failure.")


def test_authentication_failure_maps_safely_without_retry() -> None:
    completions = FakeCompletions([AuthenticationFailureError("secret-key")])

    try:
        asyncio.run(_generator(completions).generate(_request()))
    except ItineraryProviderError as error:
        assert error.code == "llm_authentication_failed"
        assert "secret-key" not in error.message
        assert completions.calls == 1
        return

    raise AssertionError("Expected authentication failure.")


def test_rate_limit_retries_once_then_maps_safely() -> None:
    completions = FakeCompletions([RateLimitFailureError(), RateLimitFailureError()])

    try:
        asyncio.run(_generator(completions).generate(_request()))
    except ItineraryProviderError as error:
        assert error.code == "llm_rate_limited"
        assert completions.calls == 2
        return

    raise AssertionError("Expected rate-limit failure.")


def test_transient_provider_failure_can_succeed_after_one_retry() -> None:
    itinerary = _real_like_itinerary()
    completions = FakeCompletions(
        [
            TemporaryProviderFailureError(),
            _response(itinerary.model_dump_json(by_alias=True)),
        ]
    )

    result = asyncio.run(_generator(completions).generate(_request()))

    assert result.id == itinerary.id
    assert completions.calls == 2


def test_refusal_fails_safely() -> None:
    completions = FakeCompletions([_response(None, refusal="refused")])

    try:
        asyncio.run(_generator(completions).generate(_request()))
    except ItineraryProviderError as error:
        assert error.code == "llm_refused"
        return

    raise AssertionError("Expected refusal failure.")


def test_incomplete_response_fails() -> None:
    completions = FakeCompletions([_response(None, finish_reason="length")])

    try:
        asyncio.run(_generator(completions).generate(_request()))
    except ItineraryProviderError as error:
        assert error.code == "llm_invalid_output"
        return

    raise AssertionError("Expected incomplete response failure.")


def test_malformed_output_fails() -> None:
    completions = FakeCompletions([_response('{"id": "bad"}')])

    try:
        asyncio.run(_generator(completions).generate(_request()))
    except ItineraryProviderError as error:
        assert error.code == "llm_invalid_output"
        return

    raise AssertionError("Expected malformed output failure.")
