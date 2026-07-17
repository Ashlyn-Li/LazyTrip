import { ChoiceCard } from "@/components/trip-preferences/choice-card";
import type { TravelPace } from "@/types/trip";

const paceOptions: { value: TravelPace; label: string }[] = [
  { value: "relaxed", label: "Relaxed — plenty of breathing room" },
  { value: "balanced", label: "Balanced — key experiences with some free time" },
  { value: "packed", label: "Packed — make the most of every day" }
];

type PaceSlideProps = {
  value: TravelPace;
  onChange: (value: TravelPace) => void;
};

export const PaceSlide = ({ value, onChange }: PaceSlideProps) => (
  <div className="space-y-5">
    <h1 className="text-3xl font-bold text-ink">What kind of pace feels right?</h1>
    <div className="grid gap-3">
      {paceOptions.map((option) => (
        <ChoiceCard key={option.value} selected={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </ChoiceCard>
      ))}
    </div>
  </div>
);
