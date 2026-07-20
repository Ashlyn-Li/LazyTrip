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
