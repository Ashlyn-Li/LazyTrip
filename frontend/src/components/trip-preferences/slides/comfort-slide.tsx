import { ChoiceCard } from "@/components/trip-preferences/choice-card";
import type { AccommodationStyle, PreferredStartPeriod, TransportMode } from "@/types/trip";

const accommodationOptions: { value: AccommodationStyle; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "mid-range", label: "Mid-range" },
  { value: "boutique", label: "Boutique" },
  { value: "luxury", label: "Luxury" }
];

const transportOptions: { value: TransportMode; label: string }[] = [
  { value: "walking", label: "Walking" },
  { value: "public-transport", label: "Public transport" },
  { value: "taxi", label: "Taxi" },
  { value: "rental-car", label: "Rental car" }
];

const startOptions: { value: PreferredStartPeriod; label: string }[] = [
  { value: "early", label: "Early: before 9 AM" },
  { value: "standard", label: "Standard: around 9–10 AM" },
  { value: "late", label: "Late: after 10 AM" }
];

type ComfortSlideProps = {
  accommodationStyle: AccommodationStyle;
  transportModes: TransportMode[];
  preferredStartPeriod: PreferredStartPeriod;
  onAccommodationChange: (value: AccommodationStyle) => void;
  onTransportToggle: (value: TransportMode) => void;
  onStartChange: (value: PreferredStartPeriod) => void;
};

export const ComfortSlide = ({
  accommodationStyle,
  transportModes,
  preferredStartPeriod,
  onAccommodationChange,
  onTransportToggle,
  onStartChange
}: ComfortSlideProps) => (
  <div className="space-y-5">
    <h1 className="text-3xl font-bold text-ink">What makes the trip comfortable for you?</h1>
    <div className="space-y-4">
      <section>
        <h2 className="mb-3 text-sm font-bold text-ink">Accommodation</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {accommodationOptions.map((option) => (
            <ChoiceCard
              key={option.value}
              selected={accommodationStyle === option.value}
              onClick={() => onAccommodationChange(option.value)}
            >
              {option.label}
            </ChoiceCard>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-bold text-ink">Transport</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {transportOptions.map((option) => (
            <ChoiceCard
              key={option.value}
              selected={transportModes.includes(option.value)}
              onClick={() => onTransportToggle(option.value)}
            >
              {option.label}
            </ChoiceCard>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-bold text-ink">Preferred daily start time</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {startOptions.map((option) => (
            <ChoiceCard
              key={option.value}
              selected={preferredStartPeriod === option.value}
              onClick={() => onStartChange(option.value)}
            >
              {option.label}
            </ChoiceCard>
          ))}
        </div>
      </section>
    </div>
  </div>
);
