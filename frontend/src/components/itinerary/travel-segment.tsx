import type { TravelSegment as TravelSegmentType } from "@/types/itinerary";

type TravelSegmentProps = {
  segment: TravelSegmentType;
};

export const TravelSegment = ({ segment }: TravelSegmentProps) => (
  <div className="ml-4 border-l-2 border-dashed border-coast-100 py-3 pl-5">
    <p className="text-sm font-bold text-slate-600">
      {segment.transportMode} · about {segment.durationMinutes} min
    </p>
    <p className="mt-1 text-sm text-slate-600">{segment.description}</p>
  </div>
);
