import type { ItineraryItemUserState } from "@/types/itinerary";

type ActivityStatusBadgeProps = {
  state: ItineraryItemUserState;
};

export const ActivityStatusBadge = ({ state }: ActivityStatusBadgeProps) => {
  if (state.changeStatus === "removed") {
    return <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">Removed</span>;
  }

  if (state.isLocked) {
    return <span className="rounded-full bg-coast-100 px-3 py-1 text-xs font-bold text-coast-700">Keep this</span>;
  }

  if (state.changeStatus === "change-requested") {
    return <span className="rounded-full bg-coral-100 px-3 py-1 text-xs font-bold text-coral-700">Change requested</span>;
  }

  return <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">Unchanged</span>;
};
