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
