import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

DEFAULT_ALLOWED_FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


class ConfigurationError(RuntimeError):
    """Raised when trusted server configuration is missing or invalid."""


def _load_local_env() -> dict[str, str]:
    env_path = Path(__file__).resolve().parent.parent / ".env"

    if not env_path.exists():
        return {}

    values: dict[str, str] = {}

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")

    return values


class Settings(BaseModel):
    allowed_frontend_origins: list[str] = Field(
        default_factory=lambda: list(DEFAULT_ALLOWED_FRONTEND_ORIGINS)
    )
    itinerary_generator: Literal["fake", "openai"] = "fake"
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_model: str | None = None
    openai_max_output_tokens: int = Field(default=6000, gt=0)
    openai_request_timeout_seconds: float = Field(default=45, gt=0)

    @field_validator("allowed_frontend_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]

        return value

    @model_validator(mode="after")
    def validate_openai_settings(self) -> "Settings":
        if self.itinerary_generator == "fake":
            return self

        missing_fields = [
            name
            for name, value in {
                "OPENAI_API_KEY": self.openai_api_key,
                "OPENAI_MODEL": self.openai_model,
            }.items()
            if not value
        ]

        if missing_fields:
            raise ConfigurationError(
                "OpenAI itinerary generation requires: " + ", ".join(missing_fields)
            )

        return self


@lru_cache
def get_settings() -> Settings:
    local_env = _load_local_env()

    def read_env(name: str, fallback: str | None = None) -> str | None:
        return os.getenv(name) or local_env.get(name) or fallback

    return Settings(
        allowed_frontend_origins=read_env("LAZYTRIP_ALLOWED_FRONTEND_ORIGINS")
        or list(DEFAULT_ALLOWED_FRONTEND_ORIGINS),
        itinerary_generator=read_env("ITINERARY_GENERATOR", "fake") or "fake",
        openai_api_key=read_env("OPENAI_API_KEY") or read_env("PORTKEY_API_KEY"),
        openai_base_url=read_env("OPENAI_BASE_URL") or read_env("PORTKEY_BASE_URL"),
        openai_model=read_env("OPENAI_MODEL") or read_env("PORTKEY_MODEL"),
        openai_max_output_tokens=int(read_env("OPENAI_MAX_OUTPUT_TOKENS", "6000") or "6000"),
        openai_request_timeout_seconds=float(
            read_env("OPENAI_REQUEST_TIMEOUT_SECONDS", "45") or "45"
        ),
    )
