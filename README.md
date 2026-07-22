# LazyTrip

LazyTrip is a full-stack international trip-planning prototype. Travellers enter a destination,
dates, party size, budget, and preferences; LazyTrip validates the information, generates a
structured itinerary through a fake or Portkey-backed LLM provider, and displays the result in an
editable itinerary interface.

> Tell us where. We'll plan the rest.

<p align="center">
      <img width="934" height="412" alt="image" src="https://github.com/user-attachments/assets/4c4656c8-6c51-4e62-b867-bea0c6f01830" />
</p>

## Project status

LazyTrip is a learning project and working local prototype, not a production booking platform.

Currently implemented:

- Responsive trip-search form.
- Slide-style preference survey.
- FastAPI validation for trip details and preferences.
- Asynchronous itinerary jobs and frontend progress polling.
- Fake provider for free, deterministic local development.
- Portkey-backed OpenAI itinerary generation.
- Strict structured output and backend itinerary validation.
- Optional fixed events.
- Itinerary display, locking, removal, undo, and feedback placeholders.
- Browser-session storage for the current planning journey.

<p align="center">
<img width="937" height="408" alt="image" src="https://github.com/user-attachments/assets/eee3f875-f21b-4e24-83b9-6a3f6640b88f" />
</p>

Not yet implemented:

- User accounts or authentication.
- Database persistence.
- Durable background jobs.
- Live maps, routes, opening hours, hotel availability, prices, or bookings.
- Applying itinerary feedback through the LLM.
- Production deployment, monitoring, quotas, or rate limiting.

## How it works

```text
Trip-search page
      |
      v
FastAPI trip validation
      |
      v
Preference survey
      |
      v
FastAPI preference validation
      |
      v
Start itinerary job -> 202 Accepted + job ID
      |
      v
Fake provider or Portkey Chat Completions
      |
      v
Pydantic + business-rule validation
      |
      v
Frontend polls job status and renders the itinerary
```

All paid/provider calls happen in the backend. The frontend never receives an API key.

## Technology

### Frontend

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- ESLint

### Backend

- Python 3.12+
- FastAPI and Uvicorn
- Pydantic v2
- Portkey Python SDK
- pytest and Ruff

## Repository layout

```text
LazyTrip/
|-- frontend/             Next.js application
|   |-- src/app/          Routes and pages
|   |-- src/components/   UI and feature components
|   |-- src/lib/api/      Frontend API boundary
|   |-- src/lib/storage/  Browser-session persistence
|   `-- src/types/        TypeScript contracts
|-- backend/              FastAPI modular monolith
|   |-- app/system/       Health/system routes
|   |-- app/modules/trips/
|   |-- app/modules/itineraries/
|   `-- tests/
`-- README.md
```

See [backend/README.md](backend/README.md) for the API contracts, provider architecture, validation
pipeline, and troubleshooting details.

## Prerequisites

- Node.js 20.9 or newer.
- npm.
- Python 3.12 or newer.
- A Portkey API key and accessible model only if real generation is enabled.

You can run the complete product with the fake provider without any external API key.

## Quick start

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd LazyTrip
```

### 2. Set up the backend

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
```

macOS or Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
cp .env.example .env
```

For the first run, keep:

```env
ITINERARY_GENERATOR=fake
```

Start FastAPI:

```bash
python -m uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive documentation is available at
`http://127.0.0.1:8000/docs`.

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` from the example:

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS or Linux:

```bash
cp .env.example .env.local
```

It should contain:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Start Next.js:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Enable real itinerary generation

First verify that the complete UI and polling flow works in fake mode. Then update `backend/.env`:

```env
ITINERARY_GENERATOR=openai
PORTKEY_API_KEY=replace-with-your-local-secret
PORTKEY_BASE_URL=https://api.portkey.ai/v1
PORTKEY_MODEL=@your-provider/your-model
OPENAI_MAX_OUTPUT_TOKENS=6000
OPENAI_REQUEST_TIMEOUT_SECONDS=120
```

Your organisation may use a private Portkey URL and a custom model slug. Use the values issued by
your organisation.

Completely restart FastAPI after changing `.env`. Existing generation jobs are not regenerated;
create a new job from the frontend.

Do not put provider credentials in `frontend/.env.local`. Variables beginning with `NEXT_PUBLIC_`
are delivered to the browser.

## API overview

```http
GET  /api/v1/health
POST /api/v1/trips/preview
POST /api/v1/trips/preferences/preview
POST /api/v1/itinerary-generations
GET  /api/v1/itinerary-generations/{job_id}
```

Itinerary generation is asynchronous:

1. The frontend posts the trip and preferences.
2. FastAPI returns `202 Accepted` and a job ID.
3. The frontend polls the job without overlapping requests.
4. FastAPI returns progress, a completed itinerary, or a safe error.
5. Completed output is saved in the current tab's `sessionStorage` and displayed.

## Fake versus real providers

| Capability | Fake | Portkey-backed |
|---|---:|---:|
| Requires API key | No | Yes |
| Network request | No | Yes |
| Deterministic | Yes | No |
| Useful for UI/polling tests | Yes | Yes |
| Follows nuanced preferences | No | Yes |
| Returns verified live travel facts | No | No |

Neither provider currently verifies live places, routes, prices, hotels, or availability. Generated
content is labelled as a draft.

## Important implementation decisions

### One FastAPI modular monolith

Trips and itineraries are separate Python modules inside one FastAPI application. They do not need
independent web servers. This keeps deployment and local learning simple while preserving module
boundaries.

### Frontend API boundary

Components do not call `fetch` everywhere. Calls and response checks live under `frontend/src/lib/api`.
This is the boundary where backend JSON becomes trusted frontend types.

### Structured LLM output

The backend asks Portkey for JSON matching the itinerary schema. It then validates that response
again with Pydantic and application rules. LLM output is never trusted solely because it is JSON.

### Explicit fixed events

A traveller comment such as “I want to visit a museum” is a preference, not a confirmed booking.
Only entries in `fixedEvents` are protected as fixed. This prevents keyword matching from creating
events the traveller did not confirm.

### Temporary job and session storage

Backend jobs live in memory; frontend planning data lives in the browser tab's `sessionStorage`.
This is suitable for the current prototype but not production persistence.

## Development commands

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

Backend:

```bash
cd backend
python -m pytest
python -m ruff check .
python -m ruff format --check .
```

Backend tests use fake clients and do not call Portkey or consume provider tokens.

## Building this project incrementally

If you are using LazyTrip as a learning reference, build one vertical slice at a time:

1. Create the trip form and FastAPI trip-preview endpoint.
2. Connect them through a typed frontend API boundary.
3. Create the preference survey and backend preference validation.
4. Add a fake asynchronous generation job and polling page.
5. Render a typed mock itinerary.
6. Introduce a provider protocol and fake/real configuration switch.
7. Integrate Portkey behind the provider interface.
8. Add structured output, Pydantic validation, and business validation.
9. Add explicit fixed events.
10. Add persistence before authentication, sharing, or multi-worker deployment.
11. Add factual travel providers before making claims about live travel information.

At each step, keep the previous path working and add tests before introducing the next external
dependency.

## Security notes

- Never commit `.env` or `.env.local`.
- Revoke any credential accidentally pasted into code, chat, screenshots, or logs.
- Keep LLM and travel-provider keys exclusively in the backend.
- Treat traveller comments as untrusted data, not executable instructions.
- Validate every browser request in FastAPI.
- Add authentication, resource ownership, rate limits, quotas, moderation, and monitoring before
  making the application public.

## Current limitations and roadmap

Recommended next milestones:

1. PostgreSQL and Alembic migrations.
2. Persistent trips, preferences, generation jobs, and itinerary versions.
3. Durable background workers.
4. Authentication and ownership checks.
5. Place, routing, hotel, activity, weather, and currency providers.
6. Revision of itineraries from structured feedback.
7. Rate limiting, quotas, observability, and deployment documentation.

LazyTrip must continue labelling unverified information until factual travel providers are connected
and their data is validated by the backend.
