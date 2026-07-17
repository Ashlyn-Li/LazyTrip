import { ChoiceCard } from "@/components/trip-preferences/choice-card";
import type { TripInterest } from "@/types/trip";

const interestOptions: { value: TripInterest; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "local-culture", label: "Local culture" },
  { value: "history", label: "History" },
  { value: "art", label: "Art" },
  { value: "nature", label: "Nature" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
  { value: "beaches", label: "Beaches" },
  { value: "photography", label: "Photography" },
  { value: "wellness", label: "Wellness" }
];

type InterestsSlideProps = {
  values: TripInterest[];
  error?: string;
  onToggle: (value: TripInterest) => void;
};

export const InterestsSlide = ({ values, error, onToggle }: InterestsSlideProps) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-3xl font-bold text-ink">What are you most interested in?</h1>
      <p className="mt-2 text-sm font-medium text-slate-600">Choose as many as you like.</p>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {interestOptions.map((option) => (
        <ChoiceCard key={option.value} selected={values.includes(option.value)} onClick={() => onToggle(option.value)}>
          {option.label}
        </ChoiceCard>
      ))}
    </div>
    <p className="min-h-5 text-sm font-semibold text-coral-700" aria-live="polite">
      {error}
    </p>
  </div>
);
