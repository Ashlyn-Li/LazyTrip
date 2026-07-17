export type Money = {
  amount: number;
  currency: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  status: "mock" | "estimated";
};

export type ItineraryActivity = {
  id: string;
  type: "activity" | "meal" | "guided-experience" | "free-time";
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  cost?: Money;
  isFixed: boolean;
  bookingStatus?: "not-required" | "recommended" | "booked";
};

export type TravelSegment = {
  id: string;
  type: "travel";
  transportMode: "walk" | "public-transport" | "taxi";
  durationMinutes: number;
  description: string;
};

export type ItineraryDayItem = ItineraryActivity | TravelSegment;

export type ItineraryDay = {
  dayNumber: number;
  date: string;
  title: string;
  summary: string;
  items: ItineraryDayItem[];
};

export type MockItinerary = {
  id: string;
  status: "mock";
  title: string;
  destination: string;
  summary: string;
  timeZone: string;
  dataStatusLabel: string;
  hotelPlaceholder: string;
  days: ItineraryDay[];
  costSummary: {
    accommodation: Money;
    food: Money;
    activities: Money;
    localTransport: Money;
    total: Money;
  };
  notes: string[];
};

export type FeedbackAction = "replace" | "reschedule" | "find-cheaper-option";

export type FeedbackReason =
  | "too-expensive"
  | "too-far"
  | "not-interested"
  | "wrong-time"
  | "too-touristy"
  | "prefer-local"
  | "slower-pace"
  | "accessibility-concern"
  | "other";

export type ItineraryFeedback = {
  id: string;
  itineraryId: string;
  itineraryItemId: string;
  action: FeedbackAction;
  reasons: FeedbackReason[];
  comment: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "cancelled";
};

export type ItineraryItemUserState = {
  itineraryItemId: string;
  isLocked: boolean;
  changeStatus: "unchanged" | "change-requested" | "removed";
};

export type ItineraryOverallFeedback = {
  itineraryId: string;
  comment: string;
  updatedAt: string;
};
