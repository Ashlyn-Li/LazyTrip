# LazyTrip Backend

FastAPI backend foundation for LazyTrip.

## Current Scope

This backend currently exposes:

```http
GET /api/v1/health
POST /api/v1/trips/preview
```

The trips preview endpoint validates and normalizes homepage trip-search details, creates a frontend-friendly session ID, calculates derived preview values, and returns them without saving anything.

It does not include persisted trips, itineraries, authentication, database access, LLM integration, travel providers, background jobs, Docker, or deployment configuration.

## CORS

The API allows local frontend requests from:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Override this with a comma-separated value:

```text
LAZYTRIP_ALLOWED_FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

CORS credentials are disabled because this integration does not use cookies or authenticated browser requests yet.

## Technology

- Python 3.12+
- FastAPI
- Pydantic v2
- Uvicorn
- pytest
- HTTPX
- Ruff
- `pyproject.toml`

## Project Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── modules/
│   │   └── trips/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── schemas.py
│   │       └── service.py
│   └── system/
│       ├── __init__.py
│       ├── router.py
│       └── schemas.py
├── tests/
│   ├── __init__.py
│   └── test_health.py
├── .env.example
├── .gitignore
├── AGENTS.md
├── pyproject.toml
└── README.md
```

## Setup

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e ".[dev]"
```

On macOS or Linux, activate with:

```bash
source .venv/bin/activate
```

## Run Locally

```bash
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "lazytrip-api"
}
```

## Trips Preview

```http
POST /api/v1/trips/preview
Content-Type: application/json
```

Example request:

```json
{
  "origin": " London, United Kingdom ",
  "destination": " Tokyo, Japan ",
  "departure_date": "2026-10-10",
  "return_date": "2026-10-13",
  "adults": 2,
  "children": 0,
  "budget": 2500,
  "currency": "GBP"
}
```

Example response:

```json
{
  "session_id": "8fc72002-3511-43a1-861f-7bf52f736b84",
  "message": "Trip information is valid",
  "trip": {
    "origin": "London, United Kingdom",
    "destination": "Tokyo, Japan",
    "departure_date": "2026-10-10",
    "return_date": "2026-10-13",
    "duration_days": 3,
    "adults": 2,
    "children": 0,
    "total_travellers": 2,
    "budget": 2500,
    "currency": "GBP"
  }
}
```

The `session_id` is generated for every valid preview request. It is not persisted yet, but the frontend can store it and pass it into later trip-planning requests.

### Frontend-to-Backend Field Mapping

The frontend currently stores trip-search data with camelCase date fields. The backend API uses canonical snake_case. The frontend will map these before calling the endpoint in a later milestone.

```text
origin        -> origin
destination   -> destination
departureDate -> departure_date
returnDate    -> return_date
adults        -> adults
children      -> children
budget        -> budget
currency      -> currency
```

### Validation Rules

- `origin` and `destination` are required and cannot be blank after trimming.
- `origin` and `destination` cannot be equal case-insensitively.
- `departure_date` and `return_date` must be valid dates.
- `return_date` must be after `departure_date`.
- At least one adult is required.
- Adults cannot exceed 20.
- Children cannot be negative or exceed 20.
- Total travellers cannot exceed 20.
- `budget` is optional, but if supplied cannot be negative.
- `currency` must be one of `GBP`, `EUR`, `USD`, `JPY`, `KRW`, `CNY`, `HKD`, `SGD`, `THB`, or `AUD`.
- Unexpected fields are rejected.

Structural validation errors return FastAPI's normal `422` response. Business-rule errors, such as equal origin and destination, return a safe client error response.

### API Docs

Run the server and open:

```text
http://127.0.0.1:8000/docs
```

The docs show the trips preview request schema, response schema, required fields, supported currency values, constraints, and example values.

No trips preview data is saved.

## Checks

```bash
ruff format --check .
pytest
ruff check .
```

## Development Policy

See `AGENTS.md` for backend architecture, layering, quality, security, and scope rules.

## Recommended Next Step

Configure frontend-to-backend communication and submit the homepage trip form to the validated preview endpoint.
