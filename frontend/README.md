# LazyTrip

LazyTrip is a frontend prototype for planning international trips.

Tagline: Tell us where. We'll plan the rest.

## Current Prototype Scope

This prototype contains a trip-search homepage, a slide-style travel-preferences survey, a backend-driven fake generation page, and a demo itinerary rendered from structured itinerary data. The homepage validates trip-search details with the FastAPI backend before opening preferences, and the preferences survey validates with the backend before opening generation. It does not save data to a database or call a real LLM/travel API.

## Technology

- Next.js App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- ESLint
- npm

## Requirements

- Node.js 18.17 or newer
- npm

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The frontend reads the backend URL from `.env.local`. For local development:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Change this value if the backend runs somewhere else. Restart the Next.js dev server after editing `.env.local`.

## Build

```bash
npm run build
```

## Project Structure

```text
src/
├── app/
│   ├── plan/preferences/
│   ├── plan/generating/
│   ├── trip/demo/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── generation/
│   ├── home/
│   ├── itinerary/
│   ├── layout/
│   ├── trip-preferences/
│   ├── trip-search/
│   └── ui/
├── lib/
│   ├── api/
│   ├── constants/
│   ├── storage/
│   └── validation/
└── types/
src/data/mock-itinerary.ts
```

## Features Currently Implemented

- LazyTrip homepage with product name, tagline, and short description
- Responsive trip-search form
- Accessible labels and keyboard-usable controls
- Validation for required locations, dates, traveller counts, and optional budget
- Backend trip preview validation before navigating from the homepage to `/plan/preferences`
- Session storage handoff from the backend-normalized trip preview to `/plan/preferences`
- Homepage restoration from saved trip-search values where practical
- Travel-preferences form with trip summary, guided-experience options, and validation
- Backend preferences preview validation before navigating from `/plan/preferences` to `/plan/generating`
- Fake backend itinerary generation at `/plan/generating`
- Backend progress polling with one non-overlapping status request at a time
- Returned backend itinerary rendering at `/trip/demo`
- Three selectable itinerary days rendered from structured mock data
- Cost summary and important mock-data notes
- Activity locking, change requests, removal, and undo on itinerary activities
- Overall itinerary follow-up comment box

## Temporary Storage

Planning-session data is stored in `sessionStorage` for the current browser tab:

- `lazytrip.tripSearch` stores valid trip-search details.
- `lazytrip.tripPlanningSession` stores the backend preview `sessionId` and normalized trip details.
- `lazytrip.tripPreferences` stores saved travel preferences.
- `lazytrip.activeItineraryGenerationJob` stores the in-progress backend generation job ID.
- `lazytrip.generatedItinerary` stores the completed backend mock itinerary.
- `lazytrip.itineraryItemStates` stores locked, removed, and change-requested item states.
- `lazytrip.itineraryFeedback` stores pending or cancelled change-request records.
- `lazytrip.itineraryOverallFeedback` stores the overall follow-up comment for the draft itinerary.

Trip-search details are sent to `POST /api/v1/trips/preview` for validation. The backend returns a generated `sessionId` and normalized trip details, but does not persist them yet.

Travel preferences are sent to `POST /api/v1/trips/preferences/preview` when the user selects `Create my trip`. The frontend waits for one backend response, saves only the normalized preferences on success, and stays on the survey when the backend reports validation, network, timeout, or server errors.

Preferences API field names intentionally match the frontend `TripPreferences` shape:

```text
pace, interests, explorationStyle, transportModes, accommodationStyle,
preferredStartTime, freeTimeLevel, guidePreference, guidedActivityTypes,
dietaryRequirements, accessibilityRequirements, mustSeePlaces,
thingsToAvoid, additionalComments
```

Backend validation errors return the user to the earliest affected survey slide:

```text
pace -> pace
interests -> interests
explorationStyle, guidePreference, guidedActivityTypes -> exploration
transportModes, accommodationStyle, preferredStartTime, freeTimeLevel -> comfort
dietaryRequirements, accessibilityRequirements, mustSeePlaces, thingsToAvoid, additionalComments -> requirements
```

Itinerary source data stays separate from user interaction state:

```text
mock itinerary data + item states + feedback records = rendered draft
```

Locking an activity means "keep this during future regeneration." Change requests, removals, and overall follow-up comments are saved only in the current browser planning session. They are not sent to an AI or backend yet.

Generation starts only from `/plan/generating`. The preferences page validates and stores preferences, then navigates there. The generation page starts one backend job, saves the job ID, polls `GET /api/v1/itinerary-generations/{job_id}` every 1-2 seconds without overlapping requests, saves the completed itinerary, and then opens `/trip/demo`.

If the page refreshes during generation, it resumes polling the saved job ID. If FastAPI restarted and the in-memory job disappeared, the page shows an expired-job recovery state. Returning to the homepage clears the temporary planning session so old answers do not drive a new trip.

## Mock Itinerary Data

Successful generation now uses the backend mock itinerary returned by FastAPI. The authoritative generated mock data lives in `backend/app/modules/itineraries/data/mock_itinerary.py`.

The frontend fallback mock remains in `src/data/mock-itinerary.ts` so `/trip/demo` can still render during development if opened directly.

The itinerary UI receives typed itinerary data through props. The normal runtime source is `lazytrip.generatedItinerary`; the frontend file is only a fallback.

Values such as origin, destination, dates, travellers, budget, selected pace, and selected interests are read from `sessionStorage` where available. Tokyo itinerary content, estimated costs, notes, and the hotel placeholder are mock data.

## Features Deliberately Not Implemented

- Constraint review page
- Real itinerary generation
- Applying requested itinerary changes
- AI regeneration from feedback
- Backend persistence
- Authentication
- AI or LLM integration
- Maps
- Travel, flight, hotel, or booking APIs
- Destination autocomplete
- Long-term persistence across devices or browser sessions

## Current Limitations

- Stored data is temporary and scoped to the current browser tab.
- Additional comments and fixed plans are saved exactly as entered, but not interpreted.
- Preferences are backend-validated before generation, but do not yet feed into real itinerary generation or constraint review.
- Generated itinerary content is still deterministic mock data.
- Routing, opening hours, availability, and prices are not verified.
- Removing an activity does not recalculate later activities or travel segments.
- Change requests are captured as structured feedback but do not create replacements yet.

## Suggested Next Step

> Persist trips, preferences, generation jobs, and itinerary versions so generation can survive backend restarts.
