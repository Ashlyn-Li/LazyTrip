import { ChoiceCard } from "@/components/trip-preferences/choice-card";
import type { ExplorationStyle, GuidePreference } from "@/types/trip";

const explorationOptions: { value: ExplorationStyle; label: string }[] = [
  { value: "mostly-independent", label: "Mostly independently" },
  { value: "independent-with-guides", label: "Independent with 1–2 guided experiences" },
  { value: "balanced-mixture", label: "A balanced mixture" },
  { value: "mostly-guided", label: "Mostly guided" }
];

const guideOptions: { value: GuidePreference; label: string }[] = [
  { value: "small-group", label: "Small group" },
  { value: "private-guide", label: "Private guide" },
  { value: "no-preference", label: "No preference" }
];

export const needsGuidePreference = (value: ExplorationStyle) => value !== "mostly-independent";

type ExplorationSlideProps = {
  explorationStyle: ExplorationStyle;
  guidePreference?: GuidePreference;
  onExplorationChange: (value: ExplorationStyle) => void;
  onGuideChange: (value: GuidePreference) => void;
};

export const ExplorationSlide = ({
  explorationStyle,
  guidePreference,
  onExplorationChange,
  onGuideChange
}: ExplorationSlideProps) => (
  <div className="space-y-5">
    <h1 className="text-3xl font-bold text-ink">How would you like to explore?</h1>
    <div className="grid gap-3">
      {explorationOptions.map((option) => (
        <ChoiceCard
          key={option.value}
          selected={explorationStyle === option.value}
          onClick={() => onExplorationChange(option.value)}
        >
          {option.label}
        </ChoiceCard>
      ))}
    </div>
    {needsGuidePreference(explorationStyle) ? (
      <div className="rounded-3xl bg-white/70 p-4">
        <p className="mb-3 text-sm font-bold text-ink">Guide style</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {guideOptions.map((option) => (
            <ChoiceCard
              key={option.value}
              selected={guidePreference === option.value}
              onClick={() => onGuideChange(option.value)}
            >
              {option.label}
            </ChoiceCard>
          ))}
        </div>
      </div>
    ) : null}
  </div>
);
