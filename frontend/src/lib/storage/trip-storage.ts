import type { TripPreferences, TripSearchData, TripSearchFormValues } from "@/types/trip";

const tripSearchKey = "lazytrip.tripSearch";
const tripPreferencesKey = "lazytrip.tripPreferences";
const tripPreferencesProgressKey = "lazytrip.tripPreferencesProgress";

const canUseSessionStorage = () => typeof window !== "undefined" && Boolean(window.sessionStorage);

const readJson = <T>(key: string): T | null => {
  if (!canUseSessionStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
};

const writeJson = <T>(key: string, value: T) => {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
};

export const saveTripSearchData = (tripSearchData: TripSearchData) => {
  writeJson(tripSearchKey, tripSearchData);
};

export const loadTripSearchData = () => readJson<TripSearchData>(tripSearchKey);

export const tripSearchDataToFormValues = (tripSearchData: TripSearchData): TripSearchFormValues => ({
  origin: tripSearchData.origin,
  destination: tripSearchData.destination,
  departureDate: tripSearchData.departureDate,
  returnDate: tripSearchData.returnDate,
  adults: String(tripSearchData.adults),
  children: String(tripSearchData.children),
  budget: tripSearchData.budget === undefined ? "" : String(tripSearchData.budget),
  currency: tripSearchData.currency
});

export const saveTripPreferences = (preferences: TripPreferences) => {
  writeJson(tripPreferencesKey, preferences);
};

export const loadTripPreferences = () => readJson<TripPreferences>(tripPreferencesKey);

export const saveTripPreferencesProgress = (progress: { preferences: TripPreferences; slideIndex: number }) => {
  writeJson(tripPreferencesProgressKey, progress);
};

export const loadTripPreferencesProgress = () =>
  readJson<{ preferences: TripPreferences; slideIndex: number }>(tripPreferencesProgressKey);

export const clearTripPreferencesProgress = () => {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(tripPreferencesProgressKey);
};
