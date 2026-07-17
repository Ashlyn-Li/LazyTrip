import type { MockItinerary } from "@/types/itinerary";
import type { TripPreferences, TripSearchData } from "@/types/trip";

type ItineraryHeaderProps = {
  itinerary: MockItinerary;
  tripSearchData: TripSearchData;
  preferences: TripPreferences;
};

const labelMap: Record<string, string> = {
  balanced: "Balanced",
  food: "Food",
  "local-culture": "Local culture",
  photography: "Photography",
  shopping: "Shopping"
};

export const ItineraryHeader = ({ itinerary, tripSearchData, preferences }: ItineraryHeaderProps) => {
  const adults = tripSearchData.adults;
  const children = tripSearchData.children;
  const travellers = adults + children;
  const budget = tripSearchData.budget ? `${tripSearchData.currency} ${tripSearchData.budget.toLocaleString()}` : "Budget not set";
  const interests = preferences.interests.length
    ? preferences.interests.map((interest) => labelMap[interest] ?? interest).join(", ")
    : "Not selected";

  return (
    <header className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-full bg-coral-100 px-4 py-2 text-sm font-bold text-coral-700">{itinerary.dataStatusLabel}</p>
        <p className="text-sm font-semibold text-slate-600">{itinerary.timeZone}</p>
      </div>
      <h1 className="mt-5 text-4xl font-bold leading-tight text-ink">{itinerary.title}</h1>
      <p className="mt-3 text-lg leading-8 text-slate-700">{itinerary.summary}</p>
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="font-bold text-ink">Destination</dt>
          <dd className="text-slate-700">{tripSearchData.destination || itinerary.destination}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Origin</dt>
          <dd className="text-slate-700">{tripSearchData.origin}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Travel dates</dt>
          <dd className="text-slate-700">
            {tripSearchData.departureDate} to {tripSearchData.returnDate}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Travellers</dt>
          <dd className="text-slate-700">{travellers} total ({adults} adults, {children} children)</dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Duration</dt>
          <dd className="text-slate-700">{itinerary.days.length} days</dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Budget</dt>
          <dd className="text-slate-700">{budget}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Pace</dt>
          <dd className="text-slate-700">{labelMap[preferences.pace] ?? preferences.pace}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Selected interests</dt>
          <dd className="text-slate-700">{interests}</dd>
        </div>
      </dl>
    </header>
  );
};
