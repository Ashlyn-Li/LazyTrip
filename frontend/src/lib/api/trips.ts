import { apiRequest } from "@/lib/api/client";
import type { TripPreviewResponse, TripSearchData } from "@/types/trip";

export const previewTrip = (tripSearchData: TripSearchData) =>
  apiRequest<TripPreviewResponse>("/api/v1/trips/preview", {
    method: "POST",
    body: tripSearchData
  });
