import type { ItineraryFeedback, ItineraryItemUserState, ItineraryOverallFeedback } from "@/types/itinerary";

const itemStatesKey = "lazytrip.itineraryItemStates";
const feedbackRecordsKey = "lazytrip.itineraryFeedback";
const overallFeedbackKey = "lazytrip.itineraryOverallFeedback";

const canUseSessionStorage = () => typeof window !== "undefined" && Boolean(window.sessionStorage);

const readJson = <T>(key: string, fallback: T): T => {
  if (!canUseSessionStorage()) {
    return fallback;
  }

  const rawValue = window.sessionStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    window.sessionStorage.removeItem(key);
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
};

export const loadItineraryItemStates = () => {
  const states = readJson<unknown>(itemStatesKey, []);

  return Array.isArray(states) ? (states as ItineraryItemUserState[]) : [];
};

export const saveItineraryItemStates = (states: ItineraryItemUserState[]) => {
  writeJson(itemStatesKey, states);
};

export const loadItineraryFeedback = () => {
  const feedback = readJson<unknown>(feedbackRecordsKey, []);

  return Array.isArray(feedback) ? (feedback as ItineraryFeedback[]) : [];
};

export const saveItineraryFeedback = (feedback: ItineraryFeedback[]) => {
  writeJson(feedbackRecordsKey, feedback);
};

export const findFeedbackForActivity = (feedback: ItineraryFeedback[], itineraryItemId: string) =>
  feedback.find((record) => record.itineraryItemId === itineraryItemId && record.status === "pending") ?? null;

export const cancelChangeRequest = (feedback: ItineraryFeedback[], itineraryItemId: string) => {
  const now = new Date().toISOString();

  return feedback.map((record) =>
    record.itineraryItemId === itineraryItemId && record.status === "pending"
      ? { ...record, status: "cancelled" as const, updatedAt: now }
      : record
  );
};

export const upsertItemState = (
  states: ItineraryItemUserState[],
  nextState: ItineraryItemUserState
) => {
  const existingState = states.find((state) => state.itineraryItemId === nextState.itineraryItemId);

  if (!existingState) {
    return [...states, nextState];
  }

  return states.map((state) => (state.itineraryItemId === nextState.itineraryItemId ? nextState : state));
};

export const getItemState = (states: ItineraryItemUserState[], itineraryItemId: string): ItineraryItemUserState => {
  return (
    states.find((state) => state.itineraryItemId === itineraryItemId) ?? {
      itineraryItemId,
      isLocked: false,
      changeStatus: "unchanged"
    }
  );
};

export const loadOverallFeedback = () => readJson<ItineraryOverallFeedback | null>(overallFeedbackKey, null);

export const saveOverallFeedback = (feedback: ItineraryOverallFeedback) => {
  writeJson(overallFeedbackKey, feedback);
};
