import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { BillingInterval, Currency, detectPreferredCurrency, getStripePriceId } from "@/lib/pricing";
import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { getStripeServer } from "@/lib/server/stripe";
import { getUserSubscription } from "@/lib/server/subscription";
import { checkoutRequestSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ipBurst = enforceIpRateLimit(request, {
    key: "billing_checkout_ip_burst",
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (!ipBurst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many checkout attempts. Please slow down.",
      limit: ipBurst.limit,
      resetAt: ipBurst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userLimit = enforceSubjectRateLimit({
    subject: `uid:${decoded.uid}`,
    key: "billing_checkout_uid_hourly",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!userLimit.allowed) {
    return rateLimitErrorResponse({
      message: "Checkout request limit reached for this hour.",
      limit: userLimit.limit,
      resetAt: userLimit.resetAt,
    });
  }

  const stripe = getStripeServer();
  const db = getAdminDb();
  if (!stripe || !db) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid billing request." }, { status: 400 });
  }
  const locale = request.headers.get("accept-language") || "en-US";
  const currency = ((parsed.data.currency as Currency) || detectPreferredCurrency(locale)).toUpperCase() as Currency;
  const interval = (parsed.data.interval as BillingInterval) || "month";
  const couponCode = parsed.data.couponCode || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const defaultTrialDays = Number(process.env.STRIPE_DEFAULT_TRIAL_DAYS || "0");
  const trialDays = Number.isFinite(defaultTrialDays) ? Math.max(0, Math.floor(defaultTrialDays)) : 0;
  const allowedCoupons = (process.env.STRIPE_ALLOWED_COUPONS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const priceId = getStripePriceId(currency, interval);
  if (!priceId) {
    return NextResponse.json({ error: "Price is not configured for selected currency." }, { status: 400 });
  }

  if (couponCode && allowedCoupons.length > 0 && !allowedCoupons.includes(couponCode)) {
    return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
  }

  const subscription = await getUserSubscription(decoded.uid);
  const billingRef = db.doc(`users/${decoded.uid}/billing/subscription`);

  let customerId = subscription.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: decoded.email,
      name: decoded.name,
      metadata: {
        firebaseUid: decoded.uid,
      },
    });
    customerId = customer.id;
    await billingRef.set(
      {
        stripeCustomerId: customerId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
  if (!customerId) {
    return NextResponse.json({ error: "Unable to resolve billing customer." }, { status: 500 });
  }
  const resolvedCustomerId: string = customerId;

  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (couponCode) {
    const promoCodes = await stripe.promotionCodes.list({
      code: couponCode,
      active: true,
      limit: 1,
    });
    const promo = promoCodes.data[0];
    if (!promo || !promo.active) {
      return NextResponse.json({ error: "Coupon code is invalid or expired." }, { status: 400 });
    }
    discounts = [{ promotion_code: promo.id }];
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: resolvedCustomerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: !couponCode,
    discounts,
    success_url: `${appUrl}/pricing?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    metadata: {
      firebaseUid: decoded.uid,
      currency,
      interval,
      couponCode: couponCode || null,
    },
    subscription_data: {
      metadata: {
        firebaseUid: decoded.uid,
      },
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
    },
  });

  return NextResponse.json({ url: session.url });
}
