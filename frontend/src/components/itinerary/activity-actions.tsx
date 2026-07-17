import type { ItineraryItemUserState } from "@/types/itinerary";

type ActivityActionsProps = {
  state: ItineraryItemUserState;
  onToggleLock: () => void;
  onRequestChange: () => void;
  onRemove: () => void;
  onUndoRemove: () => void;
};

const actionClass =
  "rounded-full border border-coast-100 bg-white px-3 py-2 text-sm font-bold text-coast-700 transition hover:bg-coast-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500";

export const ActivityActions = ({
  state,
  onToggleLock,
  onRequestChange,
  onRemove,
  onUndoRemove
}: ActivityActionsProps) => {
  if (state.changeStatus === "removed") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button className={actionClass} type="button" onClick={onUndoRemove} aria-label="Undo removal">
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={actionClass} type="button" onClick={onToggleLock} aria-label={state.isLocked ? "Unlock activity" : "Keep and lock activity"}>
        {state.isLocked ? "Unlock" : "Keep"}
      </button>
      <button className={actionClass} type="button" onClick={onRequestChange} disabled={state.isLocked} aria-label="Request a change and add feedback">
        Request change / comment
      </button>
      <button className={actionClass} type="button" onClick={onRemove} disabled={state.isLocked} aria-label="Remove activity">
        Remove
      </button>
      {state.isLocked ? <p className="text-xs font-semibold text-slate-600">Unlock this item before changing or removing it.</p> : null}
    </div>
  );
};
