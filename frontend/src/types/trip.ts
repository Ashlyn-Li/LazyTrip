import type { CurrencyCode } from "@/lib/constants/currencies";

export type TripSearchData = {
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  adults: number;
  children: number;
  budget?: number;
  currency: CurrencyCode;
};

export type TripPreviewData = TripSearchData & {
  duration_days: number;
  total_travellers: number;
};

export type TripPlanningSession = {
  sessionId: string;
  trip: TripPreviewData;
};

export type TripPreviewResponse = {
  session_id: string;
  message: "Trip information is valid";
  trip: {
    origin: string;
    destination: string;
    departure_date: string;
    return_date: string;
    duration_days: number;
    adults: number;
    children: number;
    total_travellers: number;
    budget: number | null;
    currency: CurrencyCode;
  };
};

export type TripSearchFormValues = {
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  adults: string;
  children: string;
  budget: string;
  currency: CurrencyCode;
};

export type TravelPace = "relaxed" | "balanced" | "packed";
export type TripInterest =
  | "food"
  | "local-culture"
  | "history"
  | "art"
  | "nature"
  | "shopping"
  | "nightlife"
  | "beaches"
  | "photography"
  | "wellness";
export type ExplorationStyle =
  | "mostly-independent"
  | "independent-with-guides"
  | "balanced-mixture"
  | "mostly-guided";
export type GuidePreference = "small-group" | "private-guide" | "no-preference";
export type GuidedActivityType =
  | "food-tour"
  | "culture-history-tour"
  | "nature-day-trip"
  | "nightlife-experience"
  | "workshop-class";
export type AccommodationStyle = "budget" | "mid-range" | "boutique" | "luxury";
export type TransportMode = "walking" | "public-transport" | "taxi" | "rental-car";
export type FreeTimeLevel = "very-little" | "some" | "plenty";

export type TripPreferences = {
  pace: TravelPace;
  interests: TripInterest[];
  explorationStyle: ExplorationStyle;
  transportModes: TransportMode[];
  accommodationStyle: AccommodationStyle | null;
  preferredStartTime: string;
  freeTimeLevel: FreeTimeLevel;
  guidePreference: GuidePreference | null;
  guidedActivityTypes: GuidedActivityType[];
  dietaryRequirements: string;
  accessibilityRequirements: string;
  mustSeePlaces: string;
  thingsToAvoid: string;
  additionalComments: string;
};

export type TripPreferencesPreviewResponse = {
  message: "Trip preferences are valid";
  preferences: TripPreferences;
  summary: {
    interest_count: number;
    uses_guided_experiences: boolean;
  };
};
