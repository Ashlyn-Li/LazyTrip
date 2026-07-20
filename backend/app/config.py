import os
from functools import lru_cache

from pydantic import BaseModel, Field, field_validator


class Settings(BaseModel):
    allowed_frontend_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    @field_validator("allowed_frontend_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings(
        allowed_frontend_origins=os.getenv("LAZYTRIP_ALLOWED_FRONTEND_ORIGINS")
        or Settings().allowed_frontend_origins
    )
