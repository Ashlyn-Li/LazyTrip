from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

SupportedCurrencyCode = Literal[
    "GBP",
    "EUR",
    "USD",
    "JPY",
    "KRW",
    "CNY",
    "HKD",
    "SGD",
    "THB",
    "AUD",
]

MAX_ADULTS = 10
MAX_CHILDREN = 10
MAX_TOTAL_TRAVELLERS = 10
MAX_PREFERENCE_TEXT_LENGTH = 1000

TravelPace = Literal["relaxed", "balanced", "packed"]
TripInterest = Literal[
    "food",
    "local-culture",
    "history",
    "art",
    "nature",
    "shopping",
    "nightlife",
    "beaches",
    "photography",
    "wellness",
]
ExplorationStyle = Literal[
    "mostly-independent",
    "independent-with-guides",
    "balanced-mixture",
    "mostly-guided",
]
GuidePreference = Literal["small-group", "private-guide", "no-preference"]
GuidedActivityType = Literal[
    "food-tour",
    "culture-history-tour",
    "nature-day-trip",
    "nightlife-experience",
    "workshop-class",
]
AccommodationStyle = Literal["budget", "mid-range", "boutique", "luxury"]
TransportMode = Literal["walking", "public-transport", "taxi", "rental-car"]
FreeTimeLevel = Literal["very-little", "some", "plenty"]


class TripPreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    origin: str = Field(..., examples=[" London, United Kingdom "])
    destination: str = Field(..., examples=[" Tokyo, Japan "])
    departure_date: date = Field(..., examples=["2026-10-10"])
    return_date: date = Field(..., examples=["2026-10-13"])
    adults: Annotated[int, Field(ge=1, le=MAX_ADULTS, examples=[2])]
    children: Annotated[int, Field(ge=0, le=MAX_CHILDREN, examples=[0])]
    budget: Annotated[float, Field(ge=0, allow_inf_nan=False, examples=[2500])] | None = None
    currency: SupportedCurrencyCode = Field(..., examples=["GBP"])

    @field_validator("origin", "destination")
    @classmethod
    def validate_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field must not be blank.")

        return value

    @model_validator(mode="after")
    def validate_dates_and_travellers(self) -> "TripPreviewRequest":
        if self.return_date <= self.departure_date:
            raise ValueError("Return date must be after departure date.")

        if self.adults + self.children > MAX_TOTAL_TRAVELLERS:
            raise ValueError(f"Total travellers cannot exceed {MAX_TOTAL_TRAVELLERS}.")

        return self


class NormalizedTripPreview(BaseModel):
    origin: str
    destination: str
    departure_date: date
    return_date: date
    duration_days: int
    adults: int
    children: int
    total_travellers: int
    budget: float | None = None
    currency: SupportedCurrencyCode


class TripPreviewResponse(BaseModel):
    session_id: str = Field(..., examples=["8fc72002-3511-43a1-861f-7bf52f736b84"])
    message: Literal["Trip information is valid"]
    trip: NormalizedTripPreview


class TripPreferencesPreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pace: TravelPace = Field(..., examples=["balanced"])
    interests: list[TripInterest] = Field(..., examples=[["food", "local-culture"]])
    exploration_style: ExplorationStyle = Field(
        ..., validation_alias="explorationStyle", examples=["independent-with-guides"]
    )
    transport_modes: list[TransportMode] = Field(
        ..., validation_alias="transportModes", examples=[["walking", "public-transport"]]
    )
    accommodation_style: AccommodationStyle | None = Field(
        default=None, validation_alias="accommodationStyle", examples=["boutique"]
    )
    preferred_start_time: str = Field(
        ..., validation_alias="preferredStartTime", pattern=r"^\d{2}:\d{2}$", examples=["10:00"]
    )
    free_time_level: FreeTimeLevel = Field(..., validation_alias="freeTimeLevel", examples=["some"])
    guide_preference: GuidePreference | None = Field(
        default=None, validation_alias="guidePreference", examples=["no-preference"]
    )
    guided_activity_types: list[GuidedActivityType] = Field(
        default_factory=list, validation_alias="guidedActivityTypes"
    )
    dietary_requirements: str = Field(
        default="", validation_alias="dietaryRequirements", max_length=MAX_PREFERENCE_TEXT_LENGTH
    )
    accessibility_requirements: str = Field(
        default="",
        validation_alias="accessibilityRequirements",
        max_length=MAX_PREFERENCE_TEXT_LENGTH,
    )
    must_see_places: str = Field(
        default="", validation_alias="mustSeePlaces", max_length=MAX_PREFERENCE_TEXT_LENGTH
    )
    things_to_avoid: str = Field(
        default="", validation_alias="thingsToAvoid", max_length=MAX_PREFERENCE_TEXT_LENGTH
    )
    additional_comments: str = Field(
        default="", validation_alias="additionalComments", max_length=MAX_PREFERENCE_TEXT_LENGTH
    )

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, value: list[TripInterest]) -> list[TripInterest]:
        if not value:
            raise ValueError("Choose at least one interest.")

        return value

    @field_validator("transport_modes")
    @classmethod
    def validate_transport_modes(cls, value: list[TransportMode]) -> list[TransportMode]:
        if not value:
            raise ValueError("Choose at least one transport mode.")

        return value

    @model_validator(mode="after")
    def validate_guided_preferences(self) -> "TripPreferencesPreviewRequest":
        uses_guides = self.exploration_style != "mostly-independent"

        if uses_guides and self.guide_preference is None:
            raise ValueError("Guide preference is required when guided experiences are included.")

        return self


class NormalizedTripPreferencesPreview(BaseModel):
    pace: TravelPace
    interests: list[TripInterest]
    exploration_style: ExplorationStyle = Field(serialization_alias="explorationStyle")
    transport_modes: list[TransportMode] = Field(serialization_alias="transportModes")
    accommodation_style: AccommodationStyle | None = Field(
        default=None, serialization_alias="accommodationStyle"
    )
    preferred_start_time: str = Field(serialization_alias="preferredStartTime")
    free_time_level: FreeTimeLevel = Field(serialization_alias="freeTimeLevel")
    guide_preference: GuidePreference | None = Field(
        default=None, serialization_alias="guidePreference"
    )
    guided_activity_types: list[GuidedActivityType] = Field(
        serialization_alias="guidedActivityTypes"
    )
    dietary_requirements: str = Field(serialization_alias="dietaryRequirements")
    accessibility_requirements: str = Field(serialization_alias="accessibilityRequirements")
    must_see_places: str = Field(serialization_alias="mustSeePlaces")
    things_to_avoid: str = Field(serialization_alias="thingsToAvoid")
    additional_comments: str = Field(serialization_alias="additionalComments")


class TripPreferencesPreviewSummary(BaseModel):
    interest_count: int
    uses_guided_experiences: bool


class TripPreferencesPreviewResponse(BaseModel):
    message: Literal["Trip preferences are valid"]
    preferences: NormalizedTripPreferencesPreview
    summary: TripPreferencesPreviewSummary
