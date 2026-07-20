# LazyTrip

LazyTrip is a frontend prototype for planning international trips.

Tagline: Tell us where. We'll plan the rest.

## Current Prototype Scope

This prototype contains a trip-search homepage, a slide-style travel-preferences survey, a simulated generation page, and a read-only demo itinerary. The homepage validates trip-search details with the FastAPI backend before opening preferences. It does not save data to a backend or generate a live itinerary.

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
- Simulated planning progress at `/plan/generating`
- Read-only mock itinerary at `/trip/demo`
- Three selectable itinerary days rendered from structured mock data
- Cost summary and important mock-data notes
- Activity locking, change requests, removal, and undo on itinerary activities
- Overall itinerary follow-up comment box

## Temporary Storage

Planning-session data is stored in `sessionStorage` for the current browser tab:

- `lazytrip.tripSearch` stores valid trip-search details.
- `lazytrip.tripPlanningSession` stores the backend preview `sessionId` and normalized trip details.
- `lazytrip.tripPreferences` stores saved travel preferences.
- `lazytrip.itineraryItemStates` stores locked, removed, and change-requested item states.
- `lazytrip.itineraryFeedback` stores pending or cancelled change-request records.
- `lazytrip.itineraryOverallFeedback` stores the overall follow-up comment for the draft itinerary.

Trip-search details are sent to the local FastAPI backend preview endpoint for validation. The backend returns a generated `sessionId` and normalized trip details, but does not persist them yet.

Itinerary source data stays separate from user interaction state:

```text
mock itinerary data + item states + feedback records = rendered draft
```

Locking an activity means "keep this during future regeneration." Change requests, removals, and overall follow-up comments are saved only in the current browser planning session. They are not sent to an AI or backend yet.

## Mock Itinerary Data

All demo itinerary content lives in `src/data/mock-itinerary.ts`. It includes the trip overview, day titles, activities, travel segments, costs, notes, and mock-data labels.

The itinerary UI receives this typed data through props. Future generated itinerary data should be able to replace:

```ts
const itinerary = mockItinerary;
```

without rewriting the presentation components.

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
- Preferences do not yet feed into itinerary generation or constraint review.
- The demo itinerary is static mock data.
- Routing, opening hours, availability, and prices are not verified.
- Removing an activity does not recalculate later activities or travel segments.
- Change requests are captured as structured feedback but do not create replacements yet.

## Suggested Next Step

> Add a mock change-review screen that previews all requested itinerary changes before connecting the workflow to an LLM.
