import { formatMoney, statusLabel } from "@/components/itinerary/format";
import type { MockItinerary } from "@/types/itinerary";

type CostSummaryProps = {
  costSummary: MockItinerary["costSummary"];
};

export const CostSummary = ({ costSummary }: CostSummaryProps) => {
  const rows = [
    ["Accommodation estimate", costSummary.accommodation],
    ["Food estimate", costSummary.food],
    ["Activity estimate", costSummary.activities],
    ["Local transport estimate", costSummary.localTransport],
    ["Estimated total", costSummary.total]
  ] as const;

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm">
      <h2 className="text-2xl font-bold text-ink">Cost summary</h2>
      <div className="mt-4 divide-y divide-coast-100">
        {rows.map(([label, money]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="font-semibold text-slate-700">{label}</span>
            <span className="text-right font-bold text-ink">{formatMoney(money)} · {statusLabel(money.status)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
