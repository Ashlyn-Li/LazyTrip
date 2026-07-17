type RequirementsSlideProps = {
  mustSeePlaces: string;
  requirements: string;
  fixedPlansAndComments: string;
  onChange: (name: "mustSeePlaces" | "requirements" | "fixedPlansAndComments", value: string) => void;
};

const textareaClass =
  "min-h-24 w-full resize-none rounded-2xl border border-coast-100 bg-white px-4 py-3 text-base text-ink shadow-sm transition placeholder:text-slate-400 focus:border-coast-500 focus:outline-none focus:ring-4 focus:ring-coast-100";

export const RequirementsSlide = ({
  mustSeePlaces,
  requirements,
  fixedPlansAndComments,
  onChange
}: RequirementsSlideProps) => (
  <div className="space-y-5">
    <h1 className="text-3xl font-bold text-ink">Anything we should plan around?</h1>
    <div className="grid gap-4">
      <label className="space-y-2 text-sm font-bold text-ink">
        <span>Must-see places</span>
        <textarea className={textareaClass} value={mustSeePlaces} onChange={(event) => onChange("mustSeePlaces", event.target.value)} />
      </label>
      <label className="space-y-2 text-sm font-bold text-ink">
        <span>Food, dietary, or accessibility requirements</span>
        <textarea className={textareaClass} value={requirements} onChange={(event) => onChange("requirements", event.target.value)} />
      </label>
      <label className="space-y-2 text-sm font-bold text-ink">
        <span>Fixed bookings or additional comments</span>
        <textarea
          className={textareaClass}
          placeholder="We already booked a museum for Friday at 1 PM. Please keep that time fixed."
          value={fixedPlansAndComments}
          onChange={(event) => onChange("fixedPlansAndComments", event.target.value)}
        />
      </label>
    </div>
  </div>
);
