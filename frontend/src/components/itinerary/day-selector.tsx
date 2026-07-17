import type { ItineraryDay } from "@/types/itinerary";

type DaySelectorProps = {
  days: ItineraryDay[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
};

export const DaySelector = ({ days, selectedDay, onSelectDay }: DaySelectorProps) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {days.map((day) => (
      <button
        key={day.dayNumber}
        className={`min-h-12 rounded-full px-5 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500 ${
          selectedDay === day.dayNumber ? "bg-coast-700 text-white" : "bg-white/80 text-coast-700 hover:bg-coast-50"
        }`}
        type="button"
        onClick={() => onSelectDay(day.dayNumber)}
      >
        Day {day.dayNumber}
      </button>
    ))}
  </div>
);
