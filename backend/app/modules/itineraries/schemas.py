from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.trips.schemas import TripPreferencesPreviewRequest, TripPreviewRequest

GenerationStatus = Literal[
    "queued",
    "validating",
    "collecting_data",
    "generating",
    "validating_output",
    "completed",
    "failed",
]


class Money(BaseModel):
    amount: float = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)
    converted_amount: float | None = Field(
        default=None,
        ge=0,
        validation_alias="convertedAmount",
        serialization_alias="convertedAmount",
    )
    converted_currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
        validation_alias="convertedCurrency",
        serialization_alias="convertedCurrency",
    )
    status: Literal["mock", "estimated"]


class ItineraryActivity(BaseModel):
    id: str
    type: Literal["activity", "meal", "guided-experience", "free-time"]
    title: str
    description: str
    location: str
    start_time: str = Field(
        pattern=r"^\d{2}:\d{2}$",
        validation_alias="startTime",
        serialization_alias="startTime",
    )
    end_time: str = Field(
        pattern=r"^\d{2}:\d{2}$",
        validation_alias="endTime",
        serialization_alias="endTime",
    )
    cost: Money | None = None
    is_fixed: bool = Field(validation_alias="isFixed", serialization_alias="isFixed")
    booking_status: Literal["not-required", "recommended", "booked"] | None = Field(
        default=None,
        validation_alias="bookingStatus",
        serialization_alias="bookingStatus",
    )


class TravelSegment(BaseModel):
    id: str
    type: Literal["travel"]
    transport_mode: Literal["walk", "public-transport", "taxi"] = Field(
        validation_alias="transportMode",
        serialization_alias="transportMode",
    )
    duration_minutes: int = Field(
        ge=0,
        validation_alias="durationMinutes",
        serialization_alias="durationMinutes",
    )
    description: str


ItineraryDayItem = Annotated[ItineraryActivity | TravelSegment, Field(discriminator="type")]


class ItineraryDay(BaseModel):
    day_number: int = Field(
        ge=1,
        validation_alias="dayNumber",
        serialization_alias="dayNumber",
    )
    date: str
    title: str
    summary: str
    items: list[ItineraryDayItem]


class CostSummary(BaseModel):
    accommodation: Money
    food: Money
    activities: Money
    local_transport: Money = Field(
        validation_alias="localTransport",
        serialization_alias="localTransport",
    )
    total: Money


class GeneratedItinerary(BaseModel):
    id: str
    status: Literal["mock"]
    title: str
    destination: str
    summary: str
    time_zone: str = Field(validation_alias="timeZone", serialization_alias="timeZone")
    data_status_label: str = Field(
        validation_alias="dataStatusLabel",
        serialization_alias="dataStatusLabel",
    )
    hotel_placeholder: str = Field(
        validation_alias="hotelPlaceholder",
        serialization_alias="hotelPlaceholder",
    )
    days: list[ItineraryDay]
    cost_summary: CostSummary = Field(
        validation_alias="costSummary",
        serialization_alias="costSummary",
    )
    notes: list[str]


class ItineraryGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    trip: TripPreviewRequest
    preferences: TripPreferencesPreviewRequest


class ItineraryGenerationStartResponse(BaseModel):
    job_id: str
    status: GenerationStatus
    status_url: str


class ItineraryGenerationStatusResponse(BaseModel):
    job_id: str
    status: GenerationStatus
    progress: int = Field(ge=0, le=100)
    message: str
    itinerary: GeneratedItinerary | None = None
    error: str | None = None
