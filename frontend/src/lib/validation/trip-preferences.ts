import type { TripPreferences } from "@/types/trip";

export type TripPreferencesErrors = {
  guidePreference?: string;
  interests?: string;
  transportModes?: string;
};

const usesGuides = (preferences: TripPreferences) =>
  preferences.explorationStyle !== "mostly-independent";

export const validateTripPreferences = (preferences: TripPreferences): TripPreferencesErrors => {
  const errors: TripPreferencesErrors = {};

  if (preferences.interests.length === 0) {
    errors.interests = "Choose at least one interest.";
  }

  if (preferences.transportModes.length === 0) {
    errors.transportModes = "Choose at least one transport preference.";
  }

  if (usesGuides(preferences) && !preferences.guidePreference) {
    errors.guidePreference = "Select a guide preference for your chosen exploration style.";
  }

  return errors;
};

export const hasTripPreferencesErrors = (errors: TripPreferencesErrors) => Object.keys(errors).length > 0;
