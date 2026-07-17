import { formatMoney, statusLabel } from "@/components/itinerary/format";
import { ActivityActions } from "@/components/itinerary/activity-actions";
import { ActivityStatusBadge } from "@/components/itinerary/activity-status-badge";
import { ChangeRequestPanel } from "@/components/itinerary/change-request-panel";
import { UndoNotification } from "@/components/itinerary/undo-notification";
import type {
  FeedbackAction,
  FeedbackReason,
  ItineraryActivity as ItineraryActivityType,
  ItineraryFeedback,
  ItineraryItemUserState
} from "@/types/itinerary";

type ItineraryActivityProps = {
  activity: ItineraryActivityType;
  state: ItineraryItemUserState;
  feedback: ItineraryFeedback | null;
  activeChangeRequestId: string | null;
  notification: string;
  onToggleLock: (activity: ItineraryActivityType) => void;
  onStartChangeRequest: (activity: ItineraryActivityType) => void;
  onCancelPanel: () => void;
  onSaveChangeRequest: (
    activity: ItineraryActivityType,
    input: { action: FeedbackAction; reasons: FeedbackReason[]; comment: string }
  ) => void;
  onCancelChangeRequest: (activity: ItineraryActivityType) => void;
  onRemove: (activity: ItineraryActivityType) => void;
  onUndoRemove: (activity: ItineraryActivityType) => void;
};

export const ItineraryActivity = ({
  activity,
  state,
  feedback,
  activeChangeRequestId,
  notification,
  onToggleLock,
  onStartChangeRequest,
  onCancelPanel,
  onSaveChangeRequest,
  onCancelChangeRequest,
  onRemove,
  onUndoRemove
}: ItineraryActivityProps) => (
  <article
    className={`rounded-3xl border p-4 shadow-sm ${
      state.changeStatus === "removed" ? "border-slate-200 bg-slate-50 opacity-70" : "border-coast-100 bg-white"
    }`}
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-coast-700">
          {activity.startTime} - {activity.endTime}
        </p>
        <h3 className="mt-1 text-xl font-bold text-ink">{activity.title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-coast-50 px-3 py-1 text-xs font-bold text-coast-700">{activity.type}</span>
        {activity.isFixed ? <span className="rounded-full bg-coral-100 px-3 py-1 text-xs font-bold text-coral-700">Fixed</span> : null}
        {activity.type === "guided-experience" ? <span className="rounded-full bg-coast-100 px-3 py-1 text-xs font-bold text-coast-700">Guided</span> : null}
        <ActivityStatusBadge state={state} />
      </div>
    </div>
    <p className="mt-3 text-sm leading-6 text-slate-700">{activity.description}</p>
    <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
      <p><span className="font-bold text-ink">Location:</span> {activity.location}</p>
      {activity.cost ? <p><span className="font-bold text-ink">Estimated cost:</span> {formatMoney(activity.cost)} ({statusLabel(activity.cost.status)})</p> : null}
      {activity.bookingStatus ? <p><span className="font-bold text-ink">Booking:</span> {activity.bookingStatus}</p> : null}
    </div>
    {state.changeStatus === "removed" ? (
      <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
        Activity removed from your draft. Nearby travel segments may need recalculation later.
      </p>
    ) : null}
    <div className="mt-4">
      <ActivityActions
        state={state}
        onToggleLock={() => onToggleLock(activity)}
        onRequestChange={() => onStartChangeRequest(activity)}
        onRemove={() => onRemove(activity)}
        onUndoRemove={() => onUndoRemove(activity)}
      />
    </div>
    {activeChangeRequestId === activity.id ? (
      <ChangeRequestPanel
        activity={activity}
        existingFeedback={feedback}
        onCancel={onCancelPanel}
        onSave={(input) => onSaveChangeRequest(activity, input)}
        onCancelRequest={() => onCancelChangeRequest(activity)}
      />
    ) : null}
    <UndoNotification message={notification} />
  </article>
);
