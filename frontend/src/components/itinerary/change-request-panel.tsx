"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import type { FeedbackAction, FeedbackReason, ItineraryActivity, ItineraryFeedback } from "@/types/itinerary";

const actionOptions: { value: FeedbackAction; label: string }[] = [
  { value: "replace", label: "Replace this activity" },
  { value: "reschedule", label: "Reschedule it" },
  { value: "find-cheaper-option", label: "Find a cheaper option" }
];

const reasonOptions: { value: FeedbackReason; label: string }[] = [
  { value: "too-expensive", label: "Too expensive" },
  { value: "too-far", label: "Too far away" },
  { value: "not-interested", label: "Not interested" },
  { value: "wrong-time", label: "Wrong time" },
  { value: "too-touristy", label: "Too touristy" },
  { value: "prefer-local", label: "Prefer something more local" },
  { value: "slower-pace", label: "Need a slower pace" },
  { value: "accessibility-concern", label: "Accessibility concern" },
  { value: "other", label: "Other" }
];

type ChangeRequestPanelProps = {
  activity: ItineraryActivity;
  existingFeedback: ItineraryFeedback | null;
  onCancel: () => void;
  onSave: (input: { action: FeedbackAction; reasons: FeedbackReason[]; comment: string }) => void;
  onCancelRequest: () => void;
};

export const ChangeRequestPanel = ({
  activity,
  existingFeedback,
  onCancel,
  onSave,
  onCancelRequest
}: ChangeRequestPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [action, setAction] = useState<FeedbackAction>(existingFeedback?.action ?? "replace");
  const [reasons, setReasons] = useState<FeedbackReason[]>(existingFeedback?.reasons ?? []);
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const toggleReason = (reason: FeedbackReason) => {
    setReasons((currentReasons) =>
      currentReasons.includes(reason)
        ? currentReasons.filter((currentReason) => currentReason !== reason)
        : [...currentReasons, reason]
    );
    setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (reasons.length === 0) {
      setError("Choose at least one reason.");
      return;
    }

    onSave({ action, reasons, comment });
  };

  return (
    <div
      ref={panelRef}
      className="mt-4 rounded-3xl border border-coral-100 bg-coral-100/40 p-4"
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${activity.id}-change-title`}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 id={`${activity.id}-change-title`} className="text-lg font-bold text-ink">
              What would you like to change?
            </h4>
            <p className="mt-1 text-sm text-slate-700">
              {activity.title} · {activity.startTime}-{activity.endTime} · {activity.location}
            </p>
          </div>
          <button className="text-sm font-bold text-slate-600 underline" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-bold text-ink">Requested action</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {actionOptions.map((option) => (
              <label key={option.value} className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-ink">
                <input
                  className="mr-2"
                  type="radio"
                  name={`${activity.id}-feedback-action`}
                  checked={action === option.value}
                  onChange={() => setAction(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-bold text-ink">Reasons</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {reasonOptions.map((option) => (
              <label key={option.value} className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-ink">
                <input
                  className="mr-2"
                  type="checkbox"
                  checked={reasons.includes(option.value)}
                  onChange={() => toggleReason(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="mt-2 min-h-5 text-sm font-semibold text-coral-700" aria-live="polite">
            {error}
          </p>
        </fieldset>

        <label className="mt-3 block space-y-2 text-sm font-bold text-ink">
          <span>Optional comment</span>
          <textarea
            className="min-h-24 w-full resize-none rounded-2xl border border-coast-100 bg-white px-4 py-3 text-base text-ink shadow-sm transition placeholder:text-slate-400 focus:border-coast-500 focus:outline-none focus:ring-4 focus:ring-coast-100"
            placeholder="For example: replace this with a quieter local food experience nearby."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>

        <div className="mt-4 flex flex-wrap justify-between gap-3">
          {existingFeedback ? (
            <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-coral-700" type="button" onClick={onCancelRequest}>
              Cancel change request
            </button>
          ) : (
            <span />
          )}
          <button className="rounded-full bg-coast-700 px-5 py-2 text-sm font-bold text-white" type="submit">
            Save change request
          </button>
        </div>
      </form>
    </div>
  );
};
