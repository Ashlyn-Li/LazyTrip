import { ItineraryActivity } from "@/components/itinerary/itinerary-activity";
import { TravelSegment } from "@/components/itinerary/travel-segment";
import type {
  FeedbackAction,
  FeedbackReason,
  ItineraryActivity as ItineraryActivityType,
  ItineraryDay,
  ItineraryFeedback,
  ItineraryItemUserState
} from "@/types/itinerary";

type DayTimelineProps = {
  day: ItineraryDay;
  activeChangeRequestId: string | null;
  notifications: Record<string, string>;
  getState: (itineraryItemId: string) => ItineraryItemUserState;
  getFeedback: (itineraryItemId: string) => ItineraryFeedback | null;
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

export const DayTimeline = ({
  day,
  activeChangeRequestId,
  notifications,
  getState,
  getFeedback,
  onToggleLock,
  onStartChangeRequest,
  onCancelPanel,
  onSaveChangeRequest,
  onCancelChangeRequest,
  onRemove,
  onUndoRemove
}: DayTimelineProps) => (
  <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-sm">
    <h2 className="text-2xl font-bold text-ink">Day {day.dayNumber}: {day.title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-700">{day.date} · {day.summary}</p>
    <div className="mt-5 space-y-3">
      {day.items.map((item) =>
        item.type === "travel" ? (
          <TravelSegment key={item.id} segment={item} />
        ) : (
          <ItineraryActivity
            key={item.id}
            activity={item}
            state={getState(item.id)}
            feedback={getFeedback(item.id)}
            activeChangeRequestId={activeChangeRequestId}
            notification={notifications[item.id] ?? ""}
            onToggleLock={onToggleLock}
            onStartChangeRequest={onStartChangeRequest}
            onCancelPanel={onCancelPanel}
            onSaveChangeRequest={onSaveChangeRequest}
            onCancelChangeRequest={onCancelChangeRequest}
            onRemove={onRemove}
            onUndoRemove={onUndoRemove}
          />
        )
      )}
    </div>
  </section>
);
