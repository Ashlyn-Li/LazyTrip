import type { GeneratedItinerary } from "@/types/itinerary";
import type {
  TripPlanningSession,
  TripPreferences,
  TripPreferencesPreviewResponse,
  TripPreviewResponse,
  TripSearchData,
  TripSearchFormValues
} from "@/types/trip";

const tripSearchKey = "lazytrip.tripSearch";
const tripPlanningSessionKey = "lazytrip.tripPlanningSession";
const tripPreferencesKey = "lazytrip.tripPreferences";
const activeItineraryGenerationJobKey = "lazytrip.activeItineraryGenerationJob";
const generatedItineraryKey = "lazytrip.generatedItinerary";

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

const removeJson = (key: string) => {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(key);
};

export const clearPlanningSession = () => {
  removeJson(tripSearchKey);
  removeJson(tripPlanningSessionKey);
  removeJson(tripPreferencesKey);
  removeJson(activeItineraryGenerationJobKey);
  removeJson(generatedItineraryKey);
};

export const saveTripSearchData = (tripSearchData: TripSearchData) => {
  writeJson(tripSearchKey, tripSearchData);
};

export const loadTripSearchData = () => readJson<TripSearchData>(tripSearchKey);

export const tripPreviewResponseToPlanningSession = (
  response: TripPreviewResponse
): TripPlanningSession => ({
  sessionId: response.session_id,
  trip: {
    origin: response.trip.origin,
    destination: response.trip.destination,
    departure_date: response.trip.departure_date,
    return_date: response.trip.return_date,
    duration_days: response.trip.duration_days,
    adults: response.trip.adults,
    children: response.trip.children,
    total_travellers: response.trip.total_travellers,
    budget: response.trip.budget === null ? undefined : response.trip.budget,
    currency: response.trip.currency
  }
});

export const saveTripPlanningSession = (planningSession: TripPlanningSession) => {
  writeJson(tripPlanningSessionKey, planningSession);
};

export const loadTripPlanningSession = () => readJson<TripPlanningSession>(tripPlanningSessionKey);

export const tripSearchDataToFormValues = (tripSearchData: TripSearchData): TripSearchFormValues => ({
  origin: tripSearchData.origin,
  destination: tripSearchData.destination,
  departure_date: tripSearchData.departure_date,
  return_date: tripSearchData.return_date,
  adults: String(tripSearchData.adults),
  children: String(tripSearchData.children),
  budget: tripSearchData.budget === undefined ? "" : String(tripSearchData.budget),
  currency: tripSearchData.currency
});

export const saveTripPreferences = (preferences: TripPreferences) => {
  writeJson(tripPreferencesKey, preferences);
};

export const tripPreferencesPreviewResponseToPreferences = (
  response: TripPreferencesPreviewResponse
): TripPreferences => response.preferences;

export const loadTripPreferences = () => readJson<TripPreferences>(tripPreferencesKey);

export const saveActiveItineraryGenerationJob = (jobId: string) => {
  writeJson(activeItineraryGenerationJobKey, jobId);
};

export const loadActiveItineraryGenerationJob = () =>
  readJson<string>(activeItineraryGenerationJobKey);

export const clearActiveItineraryGenerationJob = () => {
  removeJson(activeItineraryGenerationJobKey);
};

export const saveGeneratedItinerary = (itinerary: GeneratedItinerary) => {
  writeJson(generatedItineraryKey, itinerary);
};

export const loadGeneratedItinerary = () => readJson<GeneratedItinerary>(generatedItineraryKey);

export const clearGeneratedItinerary = () => {
  removeJson(generatedItineraryKey);
};
