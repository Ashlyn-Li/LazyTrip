# LazyTrip

LazyTrip is a new frontend prototype for planning international trips.

Tagline: Tell us where. We'll plan the rest.

## Current Prototype Scope

This foundation contains one user-facing feature: a responsive trip-search homepage for entering the basic details of an international trip. It does not navigate, call APIs, save data, or generate itineraries.

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
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   ├── trip-search/
│   └── ui/
├── lib/
│   ├── constants/
│   └── validation/
└── types/
```

## Features Currently Implemented

- LazyTrip homepage with product name, tagline, and short description
- Responsive trip-search form
- Accessible labels and keyboard-usable controls
- Validation for required locations, dates, traveller counts, and optional budget
- Typed `TripSearchData` object creation on successful submission
- Temporary confirmation message after valid submission
- Development console logging for submitted trip-search data

## Features Deliberately Not Implemented

- Preferences page
- Itinerary generation
- Backend, database, or API routes
- Authentication
- AI or LLM integration
- Maps
- Travel, flight, hotel, or booking APIs
- Destination autocomplete
- Local storage or cross-page state preservation

## Suggested Next Step

> Add a preferences page and preserve the submitted trip-search data between the two pages.
