import type { TripPreferences } from "@/types/trip";

export type TripPreferencesErrors = {
  interests?: string;
};

export const validateTripPreferences = (preferences: TripPreferences): TripPreferencesErrors => {
  const errors: TripPreferencesErrors = {};

  if (preferences.interests.length === 0) {
    errors.interests = "Choose at least one interest.";
  }

  return errors;
};

export const hasTripPreferencesErrors = (errors: TripPreferencesErrors) => Object.keys(errors).length > 0;
