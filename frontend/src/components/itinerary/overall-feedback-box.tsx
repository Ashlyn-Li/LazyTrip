"use client";

import { FormEvent, useState } from "react";
import { SendHorizontal } from "lucide-react";

type OverallFeedbackBoxProps = {
  initialComment: string;
  onSave: (comment: string) => void;
};

export const OverallFeedbackBox = ({ initialComment, onSave }: OverallFeedbackBoxProps) => {
  const [comment, setComment] = useState(initialComment);
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(comment);
    setMessage(comment.trim() ? "Overall change request saved." : "Overall change request cleared.");
  };

  return (
    <form
      className="rounded-[2rem] border border-coast-100 bg-white/95 p-4 shadow-soft"
      onSubmit={handleSubmit}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="text-lg font-bold text-ink" htmlFor="overall-itinerary-feedback">
          Ask for follow-up changes
        </label>
        <span className="rounded-full bg-coast-50 px-3 py-1 text-xs font-bold text-coast-700">
          Saved for later AI review
        </span>
      </div>
      <textarea
        id="overall-itinerary-feedback"
        className="min-h-28 w-full resize-none rounded-3xl border border-coast-100 bg-[#fbfffd] px-4 py-3 text-base text-ink shadow-inner outline-none placeholder:text-slate-400 focus:border-coast-500 focus:ring-4 focus:ring-coast-100"
        placeholder="Tell LazyTrip what to adjust across the whole itinerary, e.g. make this slower, add more local food, or reduce shopping."
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
          setMessage("");
        }}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500" aria-live="polite">
          {message || "Saved here only. AI changes are coming later."}
        </p>
        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-coast-700 text-lg font-bold text-white transition hover:bg-coast-500 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500"
          type="submit"
          aria-label="Save overall change request"
        >
          <SendHorizontal aria-hidden="true" size={20} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
};
