# LazyTrip Backend

FastAPI backend for LazyTrip, an international trip-planning prototype. It validates trip inputs,
generates structured itineraries through either a deterministic fake provider or Portkey, and
exposes an asynchronous polling API to the Next.js frontend.

## What is implemented

- Health endpoint and interactive OpenAPI documentation.
- Trip-detail and trip-preference validation.
- In-memory asynchronous itinerary jobs with progress polling.
- Switchable fake and Portkey-backed LLM generators.
- Strict structured itinerary output followed by Pydantic and business-rule validation.
- Optional structured fixed events.
- Safe provider error mapping and local diagnostic logging.
- Tests for routes, validation, providers, retries, malformed output, and configuration.

The current backend does **not** include a database, authentication, durable workers, maps, live
routes, hotel inventory, live prices, or booking functionality.

## Stack

- Python 3.12+
- FastAPI
- Pydantic v2
- Uvicorn
- Portkey Python SDK
- pytest
- Ruff

## Architecture

LazyTrip is a modular monolith: one FastAPI application contains focused business modules rather
than running one FastAPI service per feature.

```text
app/
|-- main.py
|-- config.py
|-- system/
|   `-- health route
`-- modules/
    |-- trips/
    |   |-- router.py
    |   |-- schemas.py
    |   `-- service.py
    `-- itineraries/
        |-- router.py
        |-- schemas.py
        |-- service.py
        |-- job_store.py
        |-- validator.py
        |-- prompt.py
        |-- providers/
        |   |-- base.py
        |   |-- fake.py
        |   |-- openai.py
        |   `-- factory.py
        `-- data/mock_itinerary.py
```

Despite the filename `providers/openai.py` and the public provider value `openai`, the real provider
currently reaches an OpenAI model through Portkey. The public value represents the underlying model
family; Portkey is the gateway.

## Request flow

```text
Next.js submits trip + preferences + optional fixed events
        |
        v
POST /api/v1/itinerary-generations -> 202 + job_id
        |
        v
In-process generation thread
        |
        +-- fake provider, or
        `-- Portkey Chat Completions
                |
                v
        strict JSON-schema response
                |
                v
        Pydantic schema validation
                |
                v
        itinerary business validation
                |
                v
GET job status -> completed itinerary or safe error
```

The job store is in memory. Jobs disappear whenever FastAPI restarts and cannot be shared safely
between multiple application workers.

## Endpoints

```http
GET  /api/v1/health
POST /api/v1/trips/preview
POST /api/v1/trips/preferences/preview
POST /api/v1/itinerary-generations
GET  /api/v1/itinerary-generations/{job_id}
```

Run the server and open `http://127.0.0.1:8000/docs` to explore the live schemas.

## Local setup

From `backend/` on Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
cp .env.example .env
```

Start the API:

```bash
python -m uvicorn app.main:app --reload
```

## Provider configuration

### Fake provider

Use the fake provider when developing the frontend, polling flow, or failure states without spending
LLM tokens:

```env
ITINERARY_GENERATOR=fake
```

It performs no network call and requires no API key. Its itinerary content is a deterministic test
fixture and should not be used to judge planning quality.

### Portkey-backed provider

The settings loader accepts either the `OPENAI_*` names or the backward-compatible `PORTKEY_*`
names. For a Portkey gateway, a clear local configuration is:

```env
ITINERARY_GENERATOR=openai
PORTKEY_API_KEY=replace-with-a-local-secret
PORTKEY_BASE_URL=https://api.portkey.ai/v1
PORTKEY_MODEL=@your-provider/your-model
OPENAI_MAX_OUTPUT_TOKENS=6000
OPENAI_REQUEST_TIMEOUT_SECONDS=120
```

Your organisation may provide a private gateway URL and a different provider/model slug. Use those
values instead of the public examples.

`OPENAI_REQUEST_TIMEOUT_SECONDS` is intentionally expressed in seconds. The provider adapter
converts it to milliseconds because Portkey's `request_timeout` expects milliseconds. This
conversion does not add a delay: 120 seconds and 120,000 milliseconds are the same duration, and a
request returns immediately when generation finishes.

Never commit `.env`. If a key is exposed in source code, logs, screenshots, or chat, revoke it and
create a replacement.

## Why Chat Completions is used

The real provider uses the route verified against the configured Portkey gateway:

```python
Portkey(...).chat.completions.create(...)
```

It sends:

- A system message containing LazyTrip's controlled planning instructions.
- A user message containing backend-produced JSON context.
- A maximum completion-token limit.
- A strict JSON Schema describing `GeneratedItinerary`.

Pydantic discriminated unions normally emit `oneOf`. The configured structured-output endpoint does
not accept `oneOf`, so the adapter converts it to `anyOf` and removes discriminator metadata before
sending it. The returned JSON is still validated against the original Pydantic models.

## Generation request

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
    "mustSeePlaces": "Senso-ji",
    "thingsToAvoid": "Nightclubs",
    "additionalComments": "Keep the first morning flexible."
  },
  "fixedEvents": [
    {
      "id": "d2-museum",
      "title": "Reserved museum visit",
      "date": "2026-09-13",
      "startTime": "13:00",
      "endTime": "15:00",
      "location": "Tokyo"
    }
  ]
}
```

`fixedEvents` is optional. Only events placed in that structured field are considered confirmed
fixed events. Free-text comments never create a fixed event automatically.

The start response is asynchronous:

```json
{
  "job_id": "generated-uuid",
  "status": "queued",
  "status_url": "/api/v1/itinerary-generations/generated-uuid"
}
```

Poll the returned URL. Job states are:

```text
queued -> validating -> collecting_data -> generating -> validating_output -> completed
                                                                            `-> failed
```

## Validation layers

LLM output is never returned directly.

### Pydantic validation

Pydantic checks the complete response shape, allowed item types, required fields, field lengths,
money structures, provider labels, and primitive value constraints.

### Business validation

The itinerary validator checks:

- Day count and consecutive dates match the trip.
- Day numbers are ordered and unique.
- Item IDs are unique.
- Activities have valid time windows and do not overlap.
- Activities are chronological.
- Structured fixed events appear exactly once and remain unchanged.
- Fake results are labelled as fake/mock.
- Real results are labelled as OpenAI-generated drafts.

The validator does not require any sample destination or sample attraction.

## Error handling

Provider failures are translated into safe application codes, including:

```text
llm_authentication_failed
llm_access_denied
llm_model_or_endpoint_not_found
llm_invalid_request
llm_rate_limited
llm_timeout
llm_unavailable
llm_refused
llm_invalid_output
llm_unknown_error
```

Raw provider errors and stack traces are not returned to the browser. Local backend logs include the
exception type and HTTP status for diagnostics, but must never log credentials.

## Tests and quality checks

```bash
python -m pytest
python -m ruff check .
python -m ruff format --check .
```

Tests use fake client objects and do not make paid provider calls.

## Troubleshooting

### `ModuleNotFoundError: portkey_ai`

Install the project into the active backend environment:

```bash
python -m pip install -e ".[dev]"
```

### HTTP 408 mentioning a very small timeout

Ensure the current provider adapter includes the seconds-to-milliseconds conversion and configure a
reasonable value such as:

```env
OPENAI_REQUEST_TIMEOUT_SECONDS=120
```

### HTTP 400 mentioning `oneOf`

Ensure the provider uses the `_strict_json_schema` normalization included in this repository.

### `llm_invalid_output`

Inspect the backend terminal. Provider parsing failures and business-validator failures are logged
locally with a safe reason. Do not weaken validation merely to make an invalid itinerary pass.

### Frontend stops waiting first

The frontend's overall polling timeout must be longer than the backend provider timeout plus the
validation stages. The current frontend uses 150 seconds.

## Security boundaries

- Keep all provider credentials in backend environment variables.
- Never expose provider keys through `NEXT_PUBLIC_*` variables.
- Treat browser requests and traveller comments as untrusted.
- Reject unexpected request fields.
- Never execute instructions found inside traveller comments.
- Do not claim bookings, availability, prices, routes, or opening hours are verified unless a
  factual provider explicitly verified them.
- Add authentication, ownership checks, rate limiting, quotas, and persistent audit records before
  deploying publicly.

## Recommended next steps

1. Add PostgreSQL and migrations.
2. Persist trips, preferences, jobs, and itinerary versions.
3. Replace in-process threads with a durable job worker.
4. Add authentication and trip ownership.
5. Add factual place and routing providers.
6. Add rate limits, usage quotas, moderation, and monitoring.
7. Add itinerary revision from structured traveller feedback.
