from dataclasses import dataclass


@dataclass(frozen=True)
class ItineraryProviderError(Exception):
    code: str
    message: str
