from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

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

ItineraryProvider = Literal["fake", "openai"]


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
    id: str = Field(min_length=1, max_length=80)
    type: Literal["activity", "meal", "guided-experience", "free-time"]
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)
    location: str = Field(min_length=1, max_length=160)
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
    id: str = Field(min_length=1, max_length=80)
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
    description: str = Field(min_length=1, max_length=300)


ItineraryDayItem = Annotated[ItineraryActivity | TravelSegment, Field(discriminator="type")]


class ItineraryDay(BaseModel):
    day_number: int = Field(
        ge=1,
        validation_alias="dayNumber",
        serialization_alias="dayNumber",
    )
    date: str
    title: str = Field(min_length=1, max_length=120)
    summary: str = Field(min_length=1, max_length=500)
    items: list[ItineraryDayItem] = Field(min_length=1, max_length=12)


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
    id: str = Field(min_length=1, max_length=80)
    status: Literal["mock", "generated"]
    provider: ItineraryProvider
    title: str = Field(min_length=1, max_length=140)
    destination: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=1000)
    time_zone: str = Field(
        min_length=1,
        max_length=80,
        validation_alias="timeZone",
        serialization_alias="timeZone",
    )
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
    notes: list[str] = Field(max_length=8)


class GenerationJobError(BaseModel):
    code: str
    message: str


class FixedEvent(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=120)
    date: date
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
    location: str | None = Field(default=None, max_length=160)

    @model_validator(mode="after")
    def validate_time_window(self) -> "FixedEvent":
        start_hour, start_minute = (int(value) for value in self.start_time.split(":"))
        end_hour, end_minute = (int(value) for value in self.end_time.split(":"))
        if start_hour > 23 or end_hour > 23 or start_minute > 59 or end_minute > 59:
            raise ValueError("Fixed event times must be valid 24-hour times.")
        if (end_hour, end_minute) <= (start_hour, start_minute):
            raise ValueError("Fixed event end time must be after its start time.")
        return self


class ItineraryGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    trip: TripPreviewRequest
    preferences: TripPreferencesPreviewRequest
    fixed_events: list[FixedEvent] = Field(
        default_factory=list,
        max_length=20,
        validation_alias="fixedEvents",
        serialization_alias="fixedEvents",
    )

    @model_validator(mode="after")
    def validate_fixed_events(self) -> "ItineraryGenerationRequest":
        seen_ids: set[str] = set()
        windows_by_date: dict[date, list[tuple[str, str]]] = {}

        for event in self.fixed_events:
            if event.id in seen_ids:
                raise ValueError("Fixed event IDs must be unique.")
            seen_ids.add(event.id)

            if event.date < self.trip.departure_date or event.date >= self.trip.return_date:
                raise ValueError("Fixed events must fall within the trip dates.")

            windows = windows_by_date.setdefault(event.date, [])
            for start_time, end_time in windows:
                if event.start_time < end_time and event.end_time > start_time:
                    raise ValueError("Fixed events cannot overlap.")
            windows.append((event.start_time, event.end_time))

        return self


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
    error: GenerationJobError | None = None
