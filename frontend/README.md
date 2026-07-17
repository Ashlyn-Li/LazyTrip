# LazyTrip

LazyTrip is a frontend prototype for planning international trips.

Tagline: Tell us where. We'll plan the rest.

## Current Prototype Scope

This prototype contains two user-facing steps: a responsive trip-search homepage and a travel-preferences page at `/plan/preferences`. It does not call APIs, save data to a backend, or generate itineraries.

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

## Build

```bash
npm run build
```

## Project Structure

```text
src/
├── app/
│   ├── plan/preferences/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── home/
│   ├── layout/
│   ├── trip-preferences/
│   ├── trip-search/
│   └── ui/
├── lib/
│   ├── constants/
│   ├── storage/
│   └── validation/
└── types/
```

## Features Currently Implemented

- LazyTrip homepage with product name, tagline, and short description
- Responsive trip-search form
- Accessible labels and keyboard-usable controls
- Validation for required locations, dates, traveller counts, and optional budget
- Session storage handoff from the homepage to `/plan/preferences`
- Homepage restoration from saved trip-search values where practical
- Travel-preferences form with trip summary, guided-experience options, and validation
- Development console logging for submitted trip-search data and saved preferences

## Temporary Storage

Planning-session data is stored in `sessionStorage` for the current browser tab:

- `lazytrip.tripSearch` stores valid trip-search details.
- `lazytrip.tripPreferences` stores saved travel preferences.

No information is sent to a backend, database, API route, or external service.

## Features Deliberately Not Implemented

- Constraint review page
- Itinerary generation
- Backend, database, or API routes
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

## Suggested Next Step

> Add a constraint-review page that converts the saved comments into editable mock constraints without calling an LLM.
