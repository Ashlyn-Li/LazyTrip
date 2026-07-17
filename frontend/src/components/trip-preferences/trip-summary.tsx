import type { TripSearchData } from "@/types/trip";

type TripSummaryProps = {
  tripSearchData: TripSearchData;
};

export const TripSummary = ({ tripSearchData }: TripSummaryProps) => {
  const travellers = tripSearchData.adults + tripSearchData.children;
  const budget = tripSearchData.budget
    ? `${tripSearchData.currency} ${tripSearchData.budget.toLocaleString()}`
    : "Not set";

  return (
    <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Trip summary</h2>
      <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="font-bold text-ink">From</dt>
          <dd>{tripSearchData.origin}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Destination</dt>
          <dd>{tripSearchData.destination}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Dates</dt>
          <dd>
            {tripSearchData.departureDate} to {tripSearchData.returnDate}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Travellers</dt>
          <dd>
            {travellers} total ({tripSearchData.adults} adults, {tripSearchData.children} children)
          </dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Approximate budget</dt>
          <dd>{budget}</dd>
        </div>
      </dl>
    </section>
  );
};
