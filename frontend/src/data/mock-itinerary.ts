import type { MockItinerary } from "@/types/itinerary";

export const mockItinerary: MockItinerary = {
  id: "tokyo-demo-3-day",
  status: "mock",
  provider: "fake",
  title: "Three-day Tokyo discovery",
  destination: "Tokyo, Japan",
  summary:
    "A balanced three-day Tokyo trip combining local food, culture, neighbourhood exploration, and one small-group guided experience.",
  timeZone: "Asia/Tokyo",
  dataStatusLabel: "Demo itinerary - mock data",
  hotelPlaceholder: "Boutique hotel base in central Tokyo, exact property to be selected later.",
  days: [
    {
      dayNumber: 1,
      date: "2026-09-12",
      title: "Shibuya, shrines, and evening food",
      summary: "A relaxed first day moving from Shibuya energy to Meiji Shrine calm, then a guided evening food tour.",
      items: [
        {
          id: "d1-arrival",
          type: "free-time",
          title: "Arrival or relaxed start",
          description: "Ease into Tokyo with time to check in, reset, and get oriented before exploring.",
          location: "Central Tokyo",
          startTime: "10:00",
          endTime: "11:00",
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d1-travel-1",
          type: "travel",
          transportMode: "public-transport",
          durationMinutes: 25,
          description: "Use local rail to reach Shibuya. Routing has not been verified yet."
        },
        {
          id: "d1-shibuya",
          type: "activity",
          title: "Shibuya crossing and neighbourhood wander",
          description: "Explore Shibuya's main crossing, side streets, shops, and photo spots at an easy pace.",
          location: "Shibuya",
          startTime: "11:30",
          endTime: "13:00",
          cost: { amount: 0, currency: "JPY", convertedAmount: 0, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d1-lunch",
          type: "meal",
          title: "Casual ramen or sushi lunch",
          description: "Keep lunch flexible around Shibuya or Harajuku depending on appetite and queues.",
          location: "Shibuya or Harajuku",
          startTime: "13:00",
          endTime: "14:00",
          cost: { amount: 4500, currency: "JPY", convertedAmount: 24, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d1-travel-2",
          type: "travel",
          transportMode: "walk",
          durationMinutes: 20,
          description: "Walk toward Meiji Shrine through the Harajuku area."
        },
        {
          id: "d1-meiji",
          type: "activity",
          title: "Meiji Shrine and Harajuku",
          description: "Visit the shrine grounds, then browse nearby streets for culture, fashion, and photography.",
          location: "Meiji Shrine and Harajuku",
          startTime: "14:20",
          endTime: "16:30",
          cost: { amount: 0, currency: "JPY", convertedAmount: 0, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d1-food-tour",
          type: "guided-experience",
          title: "Small-group evening food tour",
          description: "A guided tasting walk for local dishes and neighbourhood context. Availability has not been checked.",
          location: "Shinjuku or Shibuya",
          startTime: "18:30",
          endTime: "21:00",
          cost: { amount: 28000, currency: "JPY", convertedAmount: 150, convertedCurrency: "GBP", status: "mock" },
          isFixed: false,
          bookingStatus: "recommended"
        }
      ]
    },
    {
      dayNumber: 2,
      date: "2026-09-13",
      title: "Market morning, fixed art booking, and Ginza",
      summary: "Food-focused morning at Tsukiji, a fixed teamLab Planets visit, then Ginza and a relaxed evening.",
      items: [
        {
          id: "d2-tsukiji",
          type: "meal",
          title: "Tsukiji Outer Market breakfast",
          description: "Sample market snacks and seafood stalls. Opening hours have not been verified.",
          location: "Tsukiji Outer Market",
          startTime: "10:00",
          endTime: "12:00",
          cost: { amount: 7000, currency: "JPY", convertedAmount: 38, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d2-travel-1",
          type: "travel",
          transportMode: "public-transport",
          durationMinutes: 30,
          description: "Travel toward Toyosu. Routing and transfer timing are not verified."
        },
        {
          id: "d2-teamlab",
          type: "activity",
          title: "teamLab Planets",
          description: "Fixed immersive art booking. Keep this time protected in the day plan.",
          location: "Toyosu",
          startTime: "13:00",
          endTime: "15:00",
          cost: { amount: 7600, currency: "JPY", convertedAmount: 41, convertedCurrency: "GBP", status: "mock" },
          isFixed: true,
          bookingStatus: "booked"
        },
        {
          id: "d2-travel-2",
          type: "travel",
          transportMode: "public-transport",
          durationMinutes: 25,
          description: "Head back toward Ginza for shopping and cafes."
        },
        {
          id: "d2-ginza",
          type: "activity",
          title: "Ginza shops and design stops",
          description: "Browse department stores, stationery, design shops, and calm cafe options.",
          location: "Ginza",
          startTime: "15:45",
          endTime: "18:00",
          cost: { amount: 0, currency: "JPY", convertedAmount: 0, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d2-evening",
          type: "free-time",
          title: "Relaxed evening",
          description: "Keep dinner flexible near the hotel or Ginza, with room to rest.",
          location: "Ginza or hotel area",
          startTime: "18:30",
          endTime: "20:30",
          cost: { amount: 9000, currency: "JPY", convertedAmount: 49, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        }
      ]
    },
    {
      dayNumber: 3,
      date: "2026-09-14",
      title: "Asakusa, classic Tokyo, and final shopping",
      summary: "Traditional Asakusa, Senso-ji, then Ueno or Akihabara before a final dinner or shopping window.",
      items: [
        {
          id: "d3-asakusa",
          type: "activity",
          title: "Asakusa and Senso-ji",
          description: "Visit Senso-ji and surrounding lanes for classic Tokyo atmosphere and photography.",
          location: "Asakusa",
          startTime: "10:00",
          endTime: "12:30",
          cost: { amount: 0, currency: "JPY", convertedAmount: 0, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d3-lunch",
          type: "meal",
          title: "Tempura or soba lunch",
          description: "A simple lunch near Asakusa before moving across town.",
          location: "Asakusa",
          startTime: "12:30",
          endTime: "13:30",
          cost: { amount: 5500, currency: "JPY", convertedAmount: 30, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d3-travel-1",
          type: "travel",
          transportMode: "public-transport",
          durationMinutes: 20,
          description: "Choose Ueno for museums/parks or Akihabara for electronics and pop culture."
        },
        {
          id: "d3-ueno-akiba",
          type: "activity",
          title: "Ueno or Akihabara afternoon",
          description: "Pick a final neighbourhood based on energy: Ueno for parks and culture, Akihabara for shops.",
          location: "Ueno or Akihabara",
          startTime: "14:00",
          endTime: "17:00",
          cost: { amount: 3000, currency: "JPY", convertedAmount: 16, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        },
        {
          id: "d3-dinner",
          type: "meal",
          title: "Final dinner or last shopping stop",
          description: "Leave the evening flexible for a favourite area, souvenir shopping, or a calm final meal.",
          location: "Central Tokyo",
          startTime: "18:00",
          endTime: "20:00",
          cost: { amount: 11000, currency: "JPY", convertedAmount: 60, convertedCurrency: "GBP", status: "estimated" },
          isFixed: false,
          bookingStatus: "not-required"
        }
      ]
    }
  ],
  costSummary: {
    accommodation: { amount: 90000, currency: "JPY", convertedAmount: 486, convertedCurrency: "GBP", status: "mock" },
    food: { amount: 65000, currency: "JPY", convertedAmount: 351, convertedCurrency: "GBP", status: "estimated" },
    activities: { amount: 38600, currency: "JPY", convertedAmount: 209, convertedCurrency: "GBP", status: "mock" },
    localTransport: { amount: 12000, currency: "JPY", convertedAmount: 65, convertedCurrency: "GBP", status: "estimated" },
    total: { amount: 205600, currency: "JPY", convertedAmount: 1111, convertedCurrency: "GBP", status: "estimated" }
  },
  notes: [
    "Prices are estimates.",
    "Availability has not been checked.",
    "Opening hours have not been verified.",
    "Booking links will be added later."
  ]
};
