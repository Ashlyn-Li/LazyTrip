import type { Money } from "@/types/itinerary";

export const formatMoney = (money: Money) => {
  const primary = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: 0
  }).format(money.amount);

  if (!money.convertedAmount || !money.convertedCurrency) {
    return primary;
  }

  const converted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: money.convertedCurrency,
    maximumFractionDigits: 0
  }).format(money.convertedAmount);

  return `${primary} (${converted})`;
};

export const statusLabel = (status: Money["status"]) => (status === "mock" ? "Mock" : "Estimated");
