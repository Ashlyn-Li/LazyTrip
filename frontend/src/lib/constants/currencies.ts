export const currencies = [
  "GBP",
  "EUR",
  "USD",
  "JPY",
  "KRW",
  "CNY",
  "HKD",
  "SGD",
  "THB",
  "AUD"
] as const;

export type CurrencyCode = (typeof currencies)[number];
