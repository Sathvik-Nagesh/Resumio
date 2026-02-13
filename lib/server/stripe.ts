import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export const getStripeServer = () => {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = new Stripe(key, {
    apiVersion: "2025-01-27.acacia",
  });
  return stripeClient;
};
