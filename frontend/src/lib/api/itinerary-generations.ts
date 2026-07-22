import { apiRequest } from "@/lib/api/client";
import type {
  GeneratedItinerary,
  ItineraryGenerationStartResponse,
  ItineraryGenerationStatus,
  ItineraryGenerationStatusResponse
} from "@/types/itinerary";
import type { TripPreferences, TripSearchData } from "@/types/trip";

type StartItineraryGenerationInput = {
  trip: TripSearchData;
  preferences: TripPreferences;
};

const generationStatuses: ItineraryGenerationStatus[] = [
  "queued",
  "validating",
  "collecting_data",
  "generating",
  "validating_output",
  "completed",
  "failed"
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isGenerationStatus = (value: unknown): value is ItineraryGenerationStatus =>
  typeof value === "string" && generationStatuses.includes(value as ItineraryGenerationStatus);

const hasItineraryShape = (value: unknown): value is GeneratedItinerary => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.status === "mock" || value.status === "generated") &&
    (value.provider === "fake" || value.provider === "openai") &&
    typeof value.title === "string" &&
    typeof value.destination === "string" &&
    typeof value.summary === "string" &&
    typeof value.timeZone === "string" &&
    typeof value.dataStatusLabel === "string" &&
    typeof value.hotelPlaceholder === "string" &&
    Array.isArray(value.days) &&
    isRecord(value.costSummary) &&
    Array.isArray(value.notes)
  );
};

const validateStartResponse = (
  response: ItineraryGenerationStartResponse
): ItineraryGenerationStartResponse => {
  if (
    !isRecord(response) ||
    typeof response.job_id !== "string" ||
    !response.job_id ||
    !isGenerationStatus(response.status) ||
    typeof response.status_url !== "string"
  ) {
    throw new Error("Malformed itinerary generation start response.");
  }

  return response;
};

const validateStatusResponse = (
  response: ItineraryGenerationStatusResponse
): ItineraryGenerationStatusResponse => {
  if (
    !isRecord(response) ||
    typeof response.job_id !== "string" ||
    !isGenerationStatus(response.status) ||
    typeof response.progress !== "number" ||
    response.progress < 0 ||
    response.progress > 100 ||
    typeof response.message !== "string" ||
    (response.error !== null &&
      (!isRecord(response.error) ||
        typeof response.error.code !== "string" ||
        typeof response.error.message !== "string"))
  ) {
    throw new Error("Malformed itinerary generation status response.");
  }

  if (response.status === "completed" && !hasItineraryShape(response.itinerary)) {
    throw new Error("Completed itinerary generation did not include a valid itinerary.");
  }

  if (response.status !== "completed" && response.itinerary !== null) {
    throw new Error("Incomplete itinerary generation returned itinerary data.");
  }

  return response;
};

const toItineraryGenerationRequest = (input: StartItineraryGenerationInput): StartItineraryGenerationInput => ({
  trip: {
    origin: input.trip.origin,
    destination: input.trip.destination,
    departure_date: input.trip.departure_date,
    return_date: input.trip.return_date,
    adults: input.trip.adults,
    children: input.trip.children,
    budget: input.trip.budget,
    currency: input.trip.currency
  },
  preferences: {
    pace: input.preferences.pace,
    interests: input.preferences.interests,
    explorationStyle: input.preferences.explorationStyle,
    transportModes: input.preferences.transportModes,
    accommodationStyle: input.preferences.accommodationStyle,
    preferredStartTime: input.preferences.preferredStartTime,
    freeTimeLevel: input.preferences.freeTimeLevel,
    guidePreference: input.preferences.guidePreference,
    guidedActivityTypes: input.preferences.guidedActivityTypes,
    dietaryRequirements: input.preferences.dietaryRequirements,
    accessibilityRequirements: input.preferences.accessibilityRequirements,
    mustSeePlaces: input.preferences.mustSeePlaces,
    thingsToAvoid: input.preferences.thingsToAvoid,
    additionalComments: input.preferences.additionalComments
  }
});

export const startItineraryGeneration = async (input: StartItineraryGenerationInput) => {
  const response = await apiRequest<ItineraryGenerationStartResponse>("/api/v1/itinerary-generations", {
    method: "POST",
    body: toItineraryGenerationRequest(input)
  });

  return validateStartResponse(response);
};

export const getItineraryGeneration = async (jobId: string) => {
  const response = await apiRequest<ItineraryGenerationStatusResponse>(
    `/api/v1/itinerary-generations/${encodeURIComponent(jobId)}`
  );

  return validateStatusResponse(response);
};
