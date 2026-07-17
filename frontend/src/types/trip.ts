import type { CurrencyCode } from "@/lib/constants/currencies";

export type TripSearchData = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  budget?: number;
  currency: CurrencyCode;
};

export type TripSearchFormValues = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
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
export type AccommodationStyle = "budget" | "mid-range" | "boutique" | "luxury";
export type TransportMode = "walking" | "public-transport" | "taxi" | "rental-car";
export type PreferredStartPeriod = "early" | "standard" | "late";

export type TripPreferences = {
  pace: TravelPace;
  interests: TripInterest[];
  explorationStyle: ExplorationStyle;
  guidePreference?: GuidePreference;
  accommodationStyle: AccommodationStyle;
  transportModes: TransportMode[];
  preferredStartPeriod: PreferredStartPeriod;
  mustSeePlaces: string;
  requirements: string;
  fixedPlansAndComments: string;
};
