# LazyTrip Backend

FastAPI backend for LazyTrip, a personal international travel planner.

The backend will receive trip details and preferences from the Next.js frontend, validate them, retrieve factual travel data, coordinate itinerary generation, store trips and itinerary versions, and process traveller feedback.

This document describes the intended backend design. The backend should be built incrementally; most of the planned modules and endpoints do not exist yet.

## Current status

**Stage:** Backend foundation  
**Current milestone:** Health, trip preview, preferences preview, and fake asynchronous itinerary generation  
**Not yet included:** Database, authentication, LLM calls, maps, hotels, durable workers, or production deployment

## Implemented endpoints

```http
GET /api/v1/health
POST /api/v1/trips/preview
POST /api/v1/trips/preferences/preview
POST /api/v1/itinerary-generations
GET /api/v1/itinerary-generations/{job_id}
```

The preferences-preview endpoint remains inside the Trips module because these preferences belong to a specific trip journey. It validates and normalizes the current frontend preferences survey, returns a typed preview, and does not save anything.

### Preferences preview

```http
POST /api/v1/trips/preferences/preview
Content-Type: application/json
```

Example request:

```json
{
  "pace": "balanced",
  "interests": ["food", "local-culture", "photography", "shopping"],
  "explorationStyle": "independent-with-guides",
  "transportModes": ["walking", "public-transport"],
  "accommodationStyle": "boutique",
  "preferredStartTime": "10:00",
  "freeTimeLevel": "some",
  "guidePreference": "small-group",
  "guidedActivityTypes": ["food-tour", "culture-history-tour"],
  "dietaryRequirements": "",
  "accessibilityRequirements": "",
  "mustSeePlaces": "teamLab Planets",
  "thingsToAvoid": "",
  "additionalComments": "teamLab Planets on day 2 at 1 PM"
}
```

Example response:

```json
{
  "message": "Trip preferences are valid",
  "preferences": {
    "pace": "balanced",
    "interests": ["food", "local-culture", "photography", "shopping"],
    "explorationStyle": "independent-with-guides",
    "transportModes": ["walking", "public-transport"],
    "accommodationStyle": "boutique",
    "preferredStartTime": "10:00",
    "freeTimeLevel": "some",
    "guidePreference": "small-group",
    "guidedActivityTypes": ["food-tour", "culture-history-tour"],
    "dietaryRequirements": "",
    "accessibilityRequirements": "",
    "mustSeePlaces": "teamLab Planets",
    "thingsToAvoid": "",
    "additionalComments": "teamLab Planets on day 2 at 1 PM"
  },
  "summary": {
    "interest_count": 4,
    "uses_guided_experiences": true
  }
}
```

Preference JSON field names intentionally match the current frontend `TripPreferences` type, so no frontend API mapping is needed for this endpoint. Python code still uses snake_case internally.

Frontend/backend field mapping:

```text
pace                      -> pace
interests                 -> interests
explorationStyle          -> explorationStyle
transportModes            -> transportModes
accommodationStyle        -> accommodationStyle
preferredStartTime        -> preferredStartTime
freeTimeLevel             -> freeTimeLevel
guidePreference           -> guidePreference
guidedActivityTypes       -> guidedActivityTypes
dietaryRequirements       -> dietaryRequirements
accessibilityRequirements -> accessibilityRequirements
mustSeePlaces             -> mustSeePlaces
thingsToAvoid             -> thingsToAvoid
additionalComments        -> additionalComments
```

Validation and normalization:

- `pace`, `explorationStyle`, `freeTimeLevel`, `guidePreference`, `accommodationStyle`, interests, transport modes, and guided activity types must be supported frontend values.
- At least one interest is required.
- At least one transport mode is required.
- Duplicate interests and duplicate transport modes are removed while preserving the selected order.
- `guidePreference` is required when `explorationStyle` uses guided experiences.
- If `explorationStyle` is `mostly-independent`, `guidePreference` is normalized to `null` and `guidedActivityTypes` is normalized to an empty list.
- Optional text fields are trimmed; whitespace-only text becomes an empty string.
- Optional text fields are limited to 1000 characters.
- Unexpected fields are rejected.
- Free text is not semantically interpreted yet.
- No preferences data is saved.

### Fake itinerary generation

```http
POST /api/v1/itinerary-generations
Content-Type: application/json
```

Example request:

```json
{
  "trip": {
    "origin": "London, United Kingdom",
    "destination": "Tokyo, Japan",
    "departure_date": "2026-09-12",
    "return_date": "2026-09-15",
    "adults": 2,
    "children": 0,
    "budget": 5000,
    "currency": "GBP"
  },
  "preferences": {
    "pace": "balanced",
    "interests": ["food", "local-culture"],
    "explorationStyle": "independent-with-guides",
    "transportModes": ["walking", "public-transport"],
    "accommodationStyle": "boutique",
    "preferredStartTime": "10:00",
    "freeTimeLevel": "some",
    "guidePreference": "small-group",
    "guidedActivityTypes": ["food-tour"],
    "dietaryRequirements": "",
    "accessibilityRequirements": "",
    "mustSeePlaces": "teamLab Planets",
    "thingsToAvoid": "",
    "additionalComments": "teamLab Planets on day 2 at 1 PM"
  }
}
```

Start response:

```json
{
  "job_id": "generated-stable-id",
  "status": "queued",
  "status_url": "/api/v1/itinerary-generations/generated-stable-id"
}
```

Poll status:

```http
GET /api/v1/itinerary-generations/{job_id}
```

Job states are:

```text
queued
validating
collecting_data
generating
validating_output
completed
failed
```

Progress never moves backwards and reaches `100` only when the job is completed. Unknown jobs return `404`.

The fake generator uses `app/modules/itineraries/data/mock_itinerary.py` as the authoritative backend mock itinerary fixture. It adapts destination and dates from the submitted trip, preserves the known Tokyo fixed event on day 2 at 13:00, and clearly labels output as mock/unverified. It performs no HTTP requests and requires no API key.

Provider access goes through the `ItineraryGenerator` protocol. The only active provider is `FakeItineraryGenerator`. Router code starts jobs through the itinerary service and never calls providers directly.

Generated output is validated before completion:

- Itinerary day count must match the trip dates.
- Day dates must fall inside the trip range.
- Day numbers must be ordered and unique.
- Item IDs must be unique.
- Activity end times must follow start times.
- Activities must not overlap within a day.
- Travel durations must be non-negative.
- Money values must contain currency codes.
- The fixed Tokyo sample event remains fixed for trips with at least two days.
- Output must be labelled as mock data.

If validation fails, the job is marked `failed` and no invalid itinerary is returned.

The in-memory job store is intentionally temporary. Jobs disappear when FastAPI restarts, and multiple production workers cannot safely share this store. Durable state is the next architectural step before any real provider integration.

Future configuration:

```text
ITINERARY_GENERATOR=fake

# Future real provider configuration - not active
OPENAI_API_KEY=
OPENAI_MODEL=
```

Before a real LLM provider is enabled, LazyTrip needs moderation, rate limits, quotas, domain enforcement, and strict structured-output validation.

## Recommended next milestone

Persist trips, preferences, generation jobs, and itinerary versions so generation can survive backend restarts.

## Architecture

```text
Next.js frontend
        |
        | HTTPS / JSON
        v
FastAPI backend
        |
        +-- PostgreSQL / Supabase
        +-- LLM provider
        +-- Places and routing provider
        +-- Hotel provider
        +-- Activity provider
        +-- Weather and currency providers
```

### Frontend responsibilities

- Render the interface.
- Collect trip details and preferences.
- Perform user-friendly client-side validation.
- Submit typed requests to the backend.
- Display generation progress and validated itineraries.
- Capture locks, removals, and change requests.

The frontend must not contain secret keys or make privileged calls directly to the LLM, database, or travel providers.

### Backend responsibilities

- Validate every request independently of frontend validation.
- Authenticate the user and enforce trip ownership when authentication is added.
- Apply scheduling and business rules.
- Keep provider credentials on the server.
- Retrieve and normalize external travel data.
- Construct controlled LLM inputs.
- Validate LLM output before saving or returning it.
- Store trips, preferences, itinerary versions, and feedback.
- Return stable, documented API responses.

### External-provider responsibilities

External APIs provide factual and time-sensitive information such as:

- Place identity and coordinates.
- Opening hours and operational status.
- Routes and estimated journey times.
- Hotel availability and prices.
- Bookable guided activities.
- Weather forecasts.
- Currency conversion rates.

### LLM responsibilities

The LLM may:

- Interpret natural-language preferences.
- Rank verified candidates.
- Select from backend-supplied candidate IDs.
- Compose a structured itinerary proposal.
- Interpret traveller feedback.
- Explain recommendations.

The LLM must not:

- Invent hotels, places, prices, availability, ratings, or opening hours.
- Select an external place that the backend did not supply.
- Write directly to the database.
- Override fixed or locked itinerary items.
- Decide that a traveller is legally permitted to enter a country.

## Technology choices

Initial stack:

- Python 3.12 or another version supported by all selected dependencies.
- FastAPI.
- Pydantic v2.
- Uvicorn for local development.
- pytest for tests.
- HTTPX for outbound HTTP requests and API-level tests where appropriate.
- Ruff for linting and formatting.
- PostgreSQL when persistence is introduced.
- Alembic for database migrations when persistence is introduced.

Add dependencies only when their corresponding feature is being implemented.

## Confirmed module boundaries

The first iteration uses one FastAPI application and two business modules:

```text
LazyTrip API
|-- system routes
|   `-- health
|-- trips module
|   |-- basic trip details
|   |-- travellers
|   |-- budget and currency
|   |-- trip-specific preferences
|   `-- fixed constraints and comments
`-- itineraries module
    |-- itinerary versions
    |-- days and items
    |-- locked and removed states
    `-- feedback and change requests
```

Trip-specific preferences are part of the Trips module because they cannot exist without a trip and share its ownership and lifecycle. Feedback is part of the Itineraries module because it applies to a specific itinerary item. Separate API resources or database tables do not require separate code modules.

Create a new module only when it has genuinely independent behaviour and lifecycle. A reusable cross-trip travel profile may become its own module later; the trip survey should not.

## Repository layout

The intended modular-monolith layout is:

```text
LazyTrip/
|-- frontend/
|   |-- src/
|   `-- package.json
|-- backend/
|   |-- app/
|   |   |-- __init__.py
|   |   |-- main.py
|   |   |-- system/
|   |   |   |-- __init__.py
|   |   |   |-- router.py
|   |   |   `-- schemas.py
|   |   |-- modules/
|   |   |   |-- __init__.py
|   |   |   |-- trips/
|   |   |   |   |-- __init__.py
|   |   |   |   |-- router.py
|   |   |   |   |-- schemas.py
|   |   |   |   |-- service.py
|   |   |   |   |-- repository.py
|   |   |   |   `-- models.py
|   |   |   `-- itineraries/
|   |   |       |-- __init__.py
|   |   |       |-- router.py
|   |   |       |-- schemas.py
|   |   |       |-- service.py
|   |   |       |-- repository.py
|   |   |       `-- models.py
|   |   |-- core/
|   |   |-- providers/
|   |   `-- database/
|   |-- tests/
|   |   |-- __init__.py
|   |   |-- test_health.py
|   |   `-- test_trip_preview.py
|   |-- .env.example
|   |-- .gitignore
|   |-- pyproject.toml
|   `-- README.md
`-- README.md
```

This is the target structure, not a command to create every file immediately. Begin with `system`, then add the minimum `trips` files required for trip preview. Do not create empty repositories, models, providers, or database folders before their features exist.

## Module-internal boundaries

Each business module owns its router, schemas, service, repository, and models. This keeps related behaviour together while maintaining clear layers inside the module.

### API routes

Routes translate HTTP requests into application calls and application results into HTTP responses.

Routes may:

- Declare request and response schemas.
- Select status codes.
- Read path and query parameters.
- Call an application service.
- Translate known application exceptions.

Routes should not:

- Contain large prompts.
- Contain SQL queries.
- Know a provider's complete response format.
- Contain the full itinerary-planning algorithm.

### Schemas

Pydantic schemas define external contracts:

- Request bodies.
- Response bodies.
- Provider-normalized data.
- LLM structured output.

Use different schemas when create, update, database, and response representations have different security or validation requirements.

### Services

Services contain application behaviour and business rules, for example:

- Creating a trip.
- Validating fixed constraints.
- Coordinating place and hotel searches.
- Generating an itinerary.
- Processing feedback.
- Creating a new itinerary version.

### Repositories

Repositories isolate persistence operations:

- Insert a trip.
- Retrieve a trip.
- Save an itinerary version.
- Save feedback.

Services should not contain raw SQL or provider-specific database details.

### Providers

Provider adapters isolate third-party services:

- LLM provider.
- Places provider.
- Route provider.
- Hotel provider.
- Activity provider.

The rest of the application should consume LazyTrip's normalized models rather than raw third-party payloads.

### Cross-module rules

- The Trips module owns trip-specific preferences and constraints.
- The Itineraries module owns locks, removals, feedback, and itinerary versions.
- A module should expose deliberate service functions rather than allowing another module to import its repository directly.
- Both modules initially use one PostgreSQL database and one deployment.
- Shared code belongs in `core` only when it is genuinely used across modules.
- Avoid a generic `utils.py` dumping ground.

## API conventions

### Base path

Version public endpoints under:

```text
/api/v1
```

### Naming

- Use plural resource names: `/trips`, `/itineraries`.
- Use lowercase paths.
- Use nouns for resources and explicit action names only when the operation is not naturally CRUD, such as `/generate`.
- Use JSON `snake_case` consistently in the Python API.
- Map frontend camelCase values at the frontend API boundary if necessary.

### HTTP methods

- `GET`: retrieve without changing state.
- `POST`: create a resource or start an operation.
- `PUT`: replace a complete subordinate resource when appropriate.
- `PATCH`: partially update a resource.
- `DELETE`: remove a resource when supported.

### Status codes

- `200 OK`: successful retrieval or update.
- `201 Created`: resource created.
- `202 Accepted`: long-running generation accepted.
- `204 No Content`: successful operation with no response body.
- `400 Bad Request`: valid JSON with an invalid business condition.
- `401 Unauthorized`: authentication is required or invalid.
- `403 Forbidden`: authenticated but not allowed.
- `404 Not Found`: resource does not exist or is not visible to the user.
- `409 Conflict`: requested state change conflicts with current state.
- `422 Unprocessable Content`: request does not match its schema.
- `429 Too Many Requests`: rate limit exceeded.
- `500 Internal Server Error`: unexpected internal failure.
- `502 Bad Gateway`: upstream provider returned an unusable response.
- `503 Service Unavailable`: required provider is temporarily unavailable.

### Success envelope

```json
{
  "data": {
    "id": "trip_123",
    "destination": "Tokyo, Japan"
  }
}
```

For the first learning endpoint, returning the response model directly is acceptable. Adopt a common envelope before the API grows.

### Error envelope

```json
{
  "error": {
    "code": "INVALID_TRIP_DATES",
    "message": "The return date must be after the departure date."
  }
}
```

Never expose stack traces, SQL messages, provider secrets, authentication tokens, or raw third-party error bodies.

## Initial request schema

The first trip contract should resemble:

```python
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


CurrencyCode = Literal[
    "GBP", "EUR", "USD", "JPY", "KRW",
    "CNY", "HKD", "SGD", "THB", "AUD",
]


class TripPreviewRequest(BaseModel):
    origin: str = Field(min_length=1, max_length=200)
    destination: str = Field(min_length=1, max_length=200)
    departure_date: date
    return_date: date
    adults: int = Field(ge=1, le=20)
    children: int = Field(default=0, ge=0, le=20)
    budget: float | None = Field(default=None, ge=0)
    currency: CurrencyCode

    @model_validator(mode="after")
    def return_must_follow_departure(self):
        if self.return_date <= self.departure_date:
            raise ValueError("Return date must be after departure date")
        return self
```

Use `Decimal`, rather than binary floating-point, for persisted or calculated money when the database and cost engine are introduced. A float is acceptable only for the temporary preview endpoint.

## Planned endpoints

These endpoints describe direction, not the first implementation scope.

```text
GET    /api/v1/health

POST   /api/v1/trips/preview
POST   /api/v1/trips
GET    /api/v1/trips/{trip_id}
PATCH  /api/v1/trips/{trip_id}

PUT    /api/v1/trips/{trip_id}/preferences
GET    /api/v1/trips/{trip_id}/preferences

POST   /api/v1/trips/{trip_id}/generate
GET    /api/v1/generations/{job_id}

GET    /api/v1/trips/{trip_id}/itinerary
PATCH  /api/v1/itineraries/{itinerary_id}/items/{item_id}
POST   /api/v1/itineraries/{itinerary_id}/feedback
PATCH  /api/v1/itineraries/{itinerary_id}/feedback/{feedback_id}
DELETE /api/v1/itineraries/{itinerary_id}/feedback/{feedback_id}
POST   /api/v1/itineraries/{itinerary_id}/regenerate
```

## Bootstrap and first business milestone

Build these as two separate changes. Complete and verify the health endpoint before beginning trip preview.

### Bootstrap: health endpoint

```http
GET /api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "lazytrip-api"
}
```

This bootstrap proves only that the FastAPI application, routing, documentation, linting, and tests work.

### First business milestone: trip preview

```http
POST /api/v1/trips/preview
Content-Type: application/json
```

Example request:

```json
{
  "origin": "London, United Kingdom",
  "destination": "Tokyo, Japan",
  "departure_date": "2026-10-10",
  "return_date": "2026-10-13",
  "adults": 2,
  "children": 0,
  "budget": 2500,
  "currency": "GBP"
}
```

Expected response:

```json
{
  "message": "Trip input is valid",
  "trip": {
    "origin": "London, United Kingdom",
    "destination": "Tokyo, Japan",
    "departure_date": "2026-10-10",
    "return_date": "2026-10-13",
    "adults": 2,
    "children": 0,
    "budget": 2500,
    "currency": "GBP"
  }
}
```

The trip-preview milestone must not use a database, LLM, or external travel API. It is the first capability in the Trips module.

## CORS

During local development, the Next.js frontend and FastAPI backend use different origins. Allow only the known frontend origin:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
```

Move allowed origins into validated environment configuration before deployment. Do not default production CORS to every origin.

## Configuration and secrets

Local secrets belong in `.env`, which must be ignored by Git.

Commit `.env.example` with names but no real values:

```text
APP_ENV=development
API_HOST=127.0.0.1
API_PORT=8000
FRONTEND_ORIGIN=http://localhost:3000

# Added later
DATABASE_URL=
OPENAI_API_KEY=
GOOGLE_MAPS_API_KEY=
```

Rules:

- Never commit `.env`.
- Never log secret values.
- Validate required configuration during application startup.
- Give server and browser keys separate names.
- Do not add real provider credentials until that provider is implemented.

## Database direction

Persistence will be introduced after the frontend can call the validated preview endpoint.

Initial tables are expected to include:

- `trips`
- `trip_preferences`
- `itineraries`
- `itinerary_items`
- `itinerary_feedback`
- `generation_jobs`

Database rules:

- Use migrations for every schema change.
- Store money as an exact numeric value plus ISO currency code.
- Store external provider IDs and retrieval timestamps.
- Store international timestamps with time-zone meaning preserved.
- Version itineraries instead of overwriting the last valid plan.
- Give private records a `user_id` when authentication is introduced.
- Enforce ownership in both application logic and database policies.

## Itinerary generation design

Future generation should follow this sequence:

```text
Validate trip and preferences
        |
Retrieve candidate places, hotels, and activities
        |
Normalize and filter candidates
        |
Calculate feasible time slots and travel constraints
        |
Send verified candidates and constraints to the LLM
        |
Validate the structured LLM proposal
        |
Save a new itinerary version
        |
Return the validated itinerary
```

The LLM returns a proposal. Application code decides whether that proposal is valid.

Required post-LLM validation includes:

- Every selected external ID was supplied to the model.
- No itinerary items overlap.
- Fixed and locked events remain unchanged.
- Travel time exists between physical locations.
- Dates and local time zones are consistent.
- Hard budget and accessibility constraints are respected.
- Missing factual information is labelled, not invented.

## Feedback and regeneration

The frontend already models locks, removals, and change requests. The future backend workflow is:

```text
Receive feedback
        |
Validate itinerary ownership and item state
        |
Save pending feedback
        |
Retrieve verified alternatives
        |
Ask the planner to revise affected sections only
        |
Validate the proposed revision
        |
Create a new itinerary version
        |
Mark feedback as applied
```

Example request:

```json
{
  "itinerary_item_id": "activity-shibuya",
  "action": "replace",
  "reasons": ["too-touristy", "prefer-local"],
  "comment": "Find a quieter neighbourhood with local cafes."
}
```

Locked items must not be changed until explicitly unlocked.

## Long-running generation

Trip preview and ordinary CRUD endpoints should respond synchronously.

Full itinerary generation will eventually use a durable background job:

```text
POST /api/v1/trips/{trip_id}/generate
        |
        `-- 202 Accepted + job_id

GET /api/v1/generations/{job_id}
        |
        `-- status + progress + result/error
```

Expected states:

```text
queued
collecting_data
planning
validating
completed
failed
```

Do not add a queue for the first milestones. FastAPI in-process background tasks are not a substitute for durable processing when a generation job must survive a server restart.

## Security rules

- Treat every browser request as untrusted.
- Validate input at the API boundary.
- Authenticate before accessing private trips.
- Check resource ownership on every read and mutation.
- Keep all provider secrets on the server.
- Apply rate limits before exposing paid LLM or travel calls publicly.
- Restrict CORS to known frontend origins.
- Return safe errors without implementation details.
- Do not store passport numbers or passport images for the MVP.
- Avoid sending unnecessary personal information to the LLM.
- Do not log tokens, secrets, or complete sensitive prompts.

## Logging

Prefer structured logs containing:

- Request ID.
- Operation.
- Route.
- Status code.
- Duration.
- Trip ID when available.
- User ID when appropriate.
- Provider name for external calls.
- Safe application error code.

Never log API keys, bearer tokens, database credentials, or unnecessary personal information.

## Testing strategy

The first milestone should test:

- Health returns `200` and the expected response.
- A valid trip preview returns `200`.
- A return date before departure is rejected.
- Equal departure and return dates are rejected.
- Zero adults is rejected.
- Negative children is rejected.
- Negative budget is rejected.
- Unsupported currency is rejected.
- Missing required fields are rejected.
- Unexpected request fields are handled according to the chosen schema policy.

Later tests should cover:

- Authentication and ownership.
- Database transactions and migrations.
- Provider timeouts and malformed responses.
- LLM schema failures.
- Locked-item preservation.
- Itinerary versioning.
- Feedback state transitions.

## Quality rules

- Use type annotations for application code.
- Use Pydantic models at external boundaries.
- Keep route functions small.
- Keep business rules out of route modules.
- Do not catch every exception with a broad `except Exception` unless it is logged and translated at a deliberate top-level boundary.
- Do not suppress validation errors to make requests pass.
- Do not return raw database or provider models automatically.
- Add dependencies deliberately.
- Run linting and tests before merging.
- Update this README when an architectural decision changes.

## Planned build order

1. Scaffold FastAPI and development tooling.
2. Add health endpoint.
3. Add validated trip-preview endpoint.
4. Connect the existing frontend trip form.
5. Add PostgreSQL and migrations.
6. Persist and retrieve trips.
7. Persist trip-specific preferences within the Trips module.
8. Persist the current mock itinerary.
9. Persist locks and feedback within the Itineraries module.
10. Add authentication and ownership.
11. Integrate one factual place API.
12. Add an LLM behind a structured planner interface.
13. Add durable generation jobs and real progress.
14. Add routing, hotels, activities, weather, and currency incrementally.

Each step should be independently testable. Do not combine a new database, LLM, mapping API, and authentication system in one change.

## Bootstrap implementation checklist

- [ ] Create `backend/`.
- [ ] Initialize `pyproject.toml`.
- [ ] Add FastAPI, Uvicorn, pytest, HTTPX, and Ruff.
- [ ] Create `app/main.py`.
- [ ] Add `/api/v1/health`.
- [ ] Add health endpoint tests.
- [ ] Confirm automatic documentation at `/docs`.
- [ ] Add `.env.example` and ignore `.env`.
- [ ] Document local run, lint, and test commands.

## Definition of done for bootstrap

The bootstrap is complete when:

- The API starts locally.
- `/api/v1/health` returns the expected response.
- `/docs` displays the health endpoint and its schema.
- The automated health tests pass.
- Ruff checks pass.
- No business module, database, LLM, or external travel API has been added.

## Trip-preview implementation checklist

- [ ] Create the minimum `app/modules/trips/` package.
- [ ] Add `TripPreviewRequest` and response schemas.
- [ ] Add the Trips router and `/api/v1/trips/preview`.
- [ ] Add a small Trips service for normalization and derived values.
- [ ] Calculate trip duration and total travellers.
- [ ] Reject invalid dates, counts, budget, and currency.
- [ ] Add valid and invalid request tests.
- [ ] Configure local CORS for `http://localhost:3000`.
- [ ] Confirm the endpoint in `/docs`.
- [ ] Connect the frontend only after backend tests pass.

## Definition of done for the first business milestone

The Trips preview milestone is complete when:

- The preview endpoint accepts the valid Tokyo sample.
- Invalid input is rejected with useful validation errors.
- CORS permits the local Next.js frontend and no wildcard is used.
- Automated tests pass.
- Ruff checks pass.
- No database, LLM, or external travel API has been added.
