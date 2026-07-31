type FeedbackSummaryProps = {
  lockedCount: number;
  changeRequestCount: number;
  removedCount: number;
  hasOverallFeedback: boolean;
  isRegenerating: boolean;
  progress: number;
  message: string;
  onApplyFeedback: () => void;
};

export const FeedbackSummary = ({
  lockedCount,
  changeRequestCount,
  removedCount,
  hasOverallFeedback,
  isRegenerating,
  progress,
  message,
  onApplyFeedback
}: FeedbackSummaryProps) => (
  <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm">
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <p className="text-2xl font-bold text-ink">{lockedCount}</p>
        <p className="text-sm font-semibold text-slate-600">Locked activities</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{changeRequestCount}</p>
        <p className="text-sm font-semibold text-slate-600">Pending changes</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{removedCount}</p>
        <p className="text-sm font-semibold text-slate-600">Removed activities</p>
      </div>
    </div>
    {changeRequestCount > 0 || removedCount > 0 || lockedCount > 0 || hasOverallFeedback ? (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-coast-50 px-4 py-3">
        <p className="text-sm font-semibold text-coast-700" aria-live="polite">
          {isRegenerating ? `${message} (${progress}%)` : "Review decisions are ready for AI regeneration."}
        </p>
        <button
          className="rounded-full bg-coast-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-coast-500 disabled:bg-slate-300"
          type="button"
          disabled={isRegenerating}
          onClick={onApplyFeedback}
        >
          {isRegenerating ? "Applying feedback" : "Apply feedback"}
        </button>
      </div>
    ) : null}
  </section>
);
