export type Currency = "USD" | "INR";
export type BillingInterval = "month" | "year";

export interface ProPricePoint {
  currency: Currency;
  monthly: number;
  yearly: number;
}

export const PRO_PRICE_POINTS: Record<Currency, ProPricePoint> = {
  USD: { currency: "USD", monthly: 9, yearly: 79 },
  INR: { currency: "INR", monthly: 599, yearly: 4999 },
};

export const detectPreferredCurrency = (locale?: string): Currency => {
  if (!locale) return "USD";
  return locale.toLowerCase().includes("in") ? "INR" : "USD";
};

export const formatPrice = (amount: number, currency: Currency) =>
  new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const getProSavingsPercent = (currency: Currency) => {
  const plan = PRO_PRICE_POINTS[currency];
  const annualAsMonthly = plan.monthly * 12;
  return Math.round(((annualAsMonthly - plan.yearly) / annualAsMonthly) * 100);
};

export const getStripePriceId = (currency: Currency, interval: BillingInterval) => {
  if (currency === "USD" && interval === "month") return process.env.STRIPE_PRICE_PRO_MONTHLY_USD;
  if (currency === "USD" && interval === "year") return process.env.STRIPE_PRICE_PRO_YEARLY_USD;
  if (currency === "INR" && interval === "month") return process.env.STRIPE_PRICE_PRO_MONTHLY_INR;
  if (currency === "INR" && interval === "year") return process.env.STRIPE_PRICE_PRO_YEARLY_INR;
  return undefined;
};
