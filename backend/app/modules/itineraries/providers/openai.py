import asyncio
import logging
from typing import Protocol

from pydantic import ValidationError

from app.modules.itineraries.errors import ItineraryProviderError
from app.modules.itineraries.prompt import DEVELOPER_INSTRUCTIONS, build_itinerary_input
from app.modules.itineraries.schemas import GeneratedItinerary, ItineraryGenerationRequest

logger = logging.getLogger(__name__)

type JsonValue = str | int | float | bool | None | dict[str, "JsonValue"] | list["JsonValue"]


class ChatCompletions(Protocol):
    def create(self, **kwargs: object) -> object:
        """Create a Portkey chat completion."""


class Chat(Protocol):
    completions: ChatCompletions


class PortkeyClient(Protocol):
    chat: Chat


class OpenAIItineraryGenerator:
    """Generate itineraries through LazyTrip's Portkey-hosted OpenAI model."""

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        max_output_tokens: int,
        request_timeout_seconds: float,
        base_url: str | None = None,
        client: PortkeyClient | None = None,
    ) -> None:
        self.model = model
        self.max_output_tokens = max_output_tokens
        self.client = client or self._create_client(
            api_key=api_key,
            base_url=base_url,
            request_timeout_seconds=request_timeout_seconds,
        )

    async def generate(self, request: ItineraryGenerationRequest) -> GeneratedItinerary:
        attempts = 0

        while True:
            attempts += 1

            try:
                return await asyncio.to_thread(self._generate_sync, request)
            except ItineraryProviderError as error:
                if attempts < 2 and error.code in {
                    "llm_rate_limited",
                    "llm_timeout",
                    "llm_unavailable",
                }:
                    continue

                raise
            except Exception as error:
                logger.exception(
                    "Portkey itinerary generation failed: type=%s status_code=%s",
                    type(error).__name__,
                    getattr(error, "status_code", None),
                )
                provider_error = self._map_provider_error(error)

                if attempts < 2 and provider_error.code in {
                    "llm_rate_limited",
                    "llm_timeout",
                    "llm_unavailable",
                }:
                    continue

                raise provider_error from error

    def _generate_sync(self, request: ItineraryGenerationRequest) -> GeneratedItinerary:
        messages = [
            {"role": "system", "content": DEVELOPER_INSTRUCTIONS},
            *build_itinerary_input(request),
        ]
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_completion_tokens=self.max_output_tokens,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "lazytrip_itinerary",
                    "strict": True,
                    "schema": _strict_json_schema(
                        GeneratedItinerary.model_json_schema(by_alias=True)
                    ),
                },
            },
        )

        choices = getattr(response, "choices", None)
        if not choices:
            raise ItineraryProviderError(
                "llm_invalid_output",
                "LazyTrip received no itinerary from the provider. Please try again.",
            )

        choice = choices[0]
        if getattr(choice, "finish_reason", None) == "length":
            raise ItineraryProviderError(
                "llm_invalid_output",
                "LazyTrip could not complete this draft. Please try again.",
            )

        message = getattr(choice, "message", None)
        if message is None or getattr(message, "refusal", None):
            raise ItineraryProviderError(
                "llm_refused",
                "LazyTrip could not create this travel draft from the supplied details.",
            )

        content = getattr(message, "content", None)
        if not isinstance(content, str) or not content.strip():
            raise ItineraryProviderError(
                "llm_invalid_output",
                "LazyTrip could not read the generated draft. Please try again.",
            )

        try:
            return GeneratedItinerary.model_validate_json(content)
        except (ValidationError, ValueError, TypeError) as error:
            raise ItineraryProviderError(
                "llm_invalid_output",
                "LazyTrip received an invalid itinerary draft. Please try again.",
            ) from error

    def _create_client(
        self,
        *,
        api_key: str,
        base_url: str | None,
        request_timeout_seconds: float,
    ) -> PortkeyClient:
        try:
            from portkey_ai import Portkey
        except ImportError as error:
            raise ItineraryProviderError(
                "llm_unavailable",
                "The Portkey SDK is not installed for this backend.",
            ) from error

        kwargs: dict[str, str | int] = {
            "api_key": api_key,
            "request_timeout": max(1, round(request_timeout_seconds * 1000)),
        }

        if base_url:
            kwargs["base_url"] = base_url

        return Portkey(**kwargs)

    def _map_provider_error(self, error: Exception) -> ItineraryProviderError:
        error_name = error.__class__.__name__.lower()
        status_code = getattr(error, "status_code", None)

        if "authentication" in error_name or status_code == 401:
            return ItineraryProviderError(
                "llm_authentication_failed",
                "LazyTrip could not authenticate with the itinerary provider.",
            )

        if status_code == 403:
            return ItineraryProviderError(
                "llm_access_denied",
                "LazyTrip's itinerary provider denied access to the configured model.",
            )

        if status_code == 404:
            return ItineraryProviderError(
                "llm_model_or_endpoint_not_found",
                "LazyTrip could not find the configured model or provider endpoint.",
            )

        if status_code in {400, 422}:
            return ItineraryProviderError(
                "llm_invalid_request",
                "The itinerary provider rejected LazyTrip's structured generation request.",
            )

        if "ratelimit" in error_name or status_code == 429:
            return ItineraryProviderError(
                "llm_rate_limited",
                "LazyTrip is receiving too many provider requests. Please try again.",
            )

        if "timeout" in error_name or status_code == 408:
            return ItineraryProviderError(
                "llm_timeout",
                "LazyTrip took too long to create this draft. Please try again.",
            )

        if status_code in {500, 502, 503, 504} or "connection" in error_name:
            return ItineraryProviderError(
                "llm_unavailable",
                "LazyTrip could not reach the itinerary provider. Please try again.",
            )

        return ItineraryProviderError(
            "llm_unknown_error",
            "LazyTrip could not generate this draft. Please try again.",
        )


def _strict_json_schema(value: JsonValue) -> JsonValue:
    """Convert Pydantic's schema into the strict object form expected by the gateway."""
    if isinstance(value, dict):
        result: dict[str, JsonValue] = {}
        for key, item in value.items():
            if key == "discriminator":
                continue
            normalized_key = "anyOf" if key == "oneOf" else key
            result[normalized_key] = _strict_json_schema(item)
        if result.get("type") == "object" and isinstance(result.get("properties"), dict):
            result["additionalProperties"] = False
            result["required"] = list(result["properties"])
        return result

    if isinstance(value, list):
        return [_strict_json_schema(item) for item in value]

    return value
