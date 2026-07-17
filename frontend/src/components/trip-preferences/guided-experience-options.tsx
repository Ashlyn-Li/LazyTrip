import { PreferenceOptions } from "@/components/trip-preferences/preference-options";
import type { GuidePreference, GuidedActivityType } from "@/types/trip";

const guidePreferenceOptions: { value: GuidePreference; label: string }[] = [
  { value: "small-group", label: "Small group" },
  { value: "private-guide", label: "Private guide" },
  { value: "no-preference", label: "No preference" }
];

const activityOptions: { value: GuidedActivityType; label: string }[] = [
  { value: "food-tour", label: "Food tour" },
  { value: "culture-history-tour", label: "Culture or history tour" },
  { value: "nature-day-trip", label: "Nature or day trip" },
  { value: "nightlife-experience", label: "Nightlife experience" },
  { value: "workshop-class", label: "Workshop or class" }
];

type GuidedExperienceOptionsProps = {
  guidePreference: GuidePreference | null;
  guidedActivityTypes: GuidedActivityType[];
  onGuidePreferenceChange: (value: GuidePreference) => void;
  onActivityToggle: (value: GuidedActivityType) => void;
};

export const GuidedExperienceOptions = ({
  guidePreference,
  guidedActivityTypes,
  onGuidePreferenceChange,
  onActivityToggle
}: GuidedExperienceOptionsProps) => (
  <section className="rounded-3xl bg-coast-50/80 p-4">
    <h2 className="text-lg font-bold text-ink">Guided experiences</h2>
    <div className="mt-4 space-y-4">
      <div>
        <p className="mb-3 text-sm font-bold text-ink">Preferred guide style</p>
        <PreferenceOptions
          options={guidePreferenceOptions}
          selectedValues={guidePreference ? [guidePreference] : []}
          onToggle={onGuidePreferenceChange}
          columns="three"
        />
      </div>
      <div>
        <p className="mb-3 text-sm font-bold text-ink">Optional activity types</p>
        <PreferenceOptions
          options={activityOptions}
          selectedValues={guidedActivityTypes}
          onToggle={onActivityToggle}
          columns="three"
        />
      </div>
    </div>
  </section>
);
