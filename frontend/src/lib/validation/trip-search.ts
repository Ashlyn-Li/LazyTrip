import { currencies } from "@/lib/constants/currencies";
import type { TripSearchData, TripSearchFormValues } from "@/types/trip";

export type TripSearchErrors = Partial<Record<keyof TripSearchFormValues, string>>;

type ValidationResult =
  | {
      success: true;
      data: TripSearchData;
      errors: TripSearchErrors;
    }
  | {
      success: false;
      errors: TripSearchErrors;
    };

const isValidCurrency = (value: string): value is TripSearchData["currency"] =>
  currencies.some((currency) => currency === value);

const parseNonNegativeInteger = (value: string): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return Number.NaN;
  }

  return parsed;
};

export const validateTripSearch = (values: TripSearchFormValues): ValidationResult => {
  const errors: TripSearchErrors = {};
  const origin = values.origin.trim();
  const destination = values.destination.trim();
  const adults = parseNonNegativeInteger(values.adults);
  const children = parseNonNegativeInteger(values.children);
  const budgetValue = values.budget.trim();
  const budget = budgetValue === "" ? undefined : Number(budgetValue);

  if (!origin) {
    errors.origin = "Enter where you are travelling from.";
  }

  if (!destination) {
    errors.destination = "Enter a destination.";
  }

  if (!values.departureDate) {
    errors.departureDate = "Choose a departure date.";
  }

  if (!values.returnDate) {
    errors.returnDate = "Choose a return date.";
  }

  if (values.departureDate && values.returnDate && values.returnDate <= values.departureDate) {
    errors.returnDate = "Return date must be after the departure date.";
  }

  if (!Number.isFinite(adults) || adults < 1) {
    errors.adults = "At least one adult is required.";
  }

  if (!Number.isFinite(children) || children < 0) {
    errors.children = "Children cannot be negative.";
  }

  if (budget !== undefined && (!Number.isFinite(budget) || budget < 0)) {
    errors.budget = "Budget cannot be negative.";
  }

  if (!isValidCurrency(values.currency)) {
    errors.currency = "Choose a supported currency.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    errors: {},
    data: {
      origin,
      destination,
      departureDate: values.departureDate,
      returnDate: values.returnDate,
      adults,
      children,
      budget,
      currency: values.currency
    }
  };
};
