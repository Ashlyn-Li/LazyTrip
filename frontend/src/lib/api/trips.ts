import { apiRequest } from "@/lib/api/client";
import type {
  TripPreferences,
  TripPreferencesPreviewResponse,
  TripPreviewResponse,
  TripSearchData
} from "@/types/trip";

export const previewTrip = (tripSearchData: TripSearchData) =>
  apiRequest<TripPreviewResponse>("/api/v1/trips/preview", {
    method: "POST",
    body: tripSearchData
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const hasPreferencesShape = (value: unknown): value is TripPreferences => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.pace === "string" &&
    Array.isArray(value.interests) &&
    typeof value.explorationStyle === "string" &&
    Array.isArray(value.transportModes) &&
    (typeof value.accommodationStyle === "string" || value.accommodationStyle === null) &&
    typeof value.preferredStartTime === "string" &&
    typeof value.freeTimeLevel === "string" &&
    (typeof value.guidePreference === "string" || value.guidePreference === null) &&
    Array.isArray(value.guidedActivityTypes) &&
    typeof value.dietaryRequirements === "string" &&
    typeof value.accessibilityRequirements === "string" &&
    typeof value.mustSeePlaces === "string" &&
    typeof value.thingsToAvoid === "string" &&
    typeof value.additionalComments === "string"
  );
};

const validateTripPreferencesPreviewResponse = (
  response: TripPreferencesPreviewResponse
): TripPreferencesPreviewResponse => {
  if (
    !isRecord(response) ||
    response.message !== "Trip preferences are valid" ||
    !hasPreferencesShape(response.preferences) ||
    !isRecord(response.summary) ||
    typeof response.summary.interest_count !== "number" ||
    typeof response.summary.uses_guided_experiences !== "boolean"
  ) {
    throw new Error("Malformed preferences preview response.");
  }

  return response;
};

const toTripPreferencesPreviewRequest = (preferences: TripPreferences): TripPreferences => ({
  pace: preferences.pace,
  interests: preferences.interests,
  explorationStyle: preferences.explorationStyle,
  transportModes: preferences.transportModes,
  accommodationStyle: preferences.accommodationStyle,
  preferredStartTime: preferences.preferredStartTime,
  freeTimeLevel: preferences.freeTimeLevel,
  guidePreference: preferences.guidePreference,
  guidedActivityTypes: preferences.guidedActivityTypes,
  dietaryRequirements: preferences.dietaryRequirements,
  accessibilityRequirements: preferences.accessibilityRequirements,
  mustSeePlaces: preferences.mustSeePlaces,
  thingsToAvoid: preferences.thingsToAvoid,
  additionalComments: preferences.additionalComments
});

export const previewTripPreferences = async (preferences: TripPreferences) => {
  const response = await apiRequest<TripPreferencesPreviewResponse>(
    "/api/v1/trips/preferences/preview",
    {
      method: "POST",
      body: toTripPreferencesPreviewRequest(preferences)
    }
  );

  return validateTripPreferencesPreviewResponse(response);
};
