import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { getStripeServer } from "@/lib/server/stripe";

export const runtime = "nodejs";

const toIso = (value: number | null | undefined) => {
  if (!value) return undefined;
  return new Date(value * 1000).toISOString();
};

const resolveFirebaseUid = async (
  stripe: Stripe,
  subscription: Stripe.Subscription
) => {
  const fromMeta = subscription.metadata?.firebaseUid;
  if (fromMeta) return fromMeta;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  return customer.metadata?.firebaseUid || null;
};

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "stripe_webhook_burst",
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Webhook rate limit exceeded.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const stripe = getStripeServer();
  const db = getAdminDb();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !db || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
  } catch (error) {
    console.error("Invalid Stripe webhook signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const startedAt = Date.now();
    try {
      await db.doc(`stripeWebhookEvents/${event.id}`).create({
        eventId: event.id,
        eventType: event.type,
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      const message = String(error?.message || "");
      const alreadyHandled =
        error?.code === 6 ||
        error?.code === "already-exists" ||
        message.includes("Already exists");
      if (alreadyHandled) {
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw error;
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.deleted"
    ) {
      let subscription: Stripe.Subscription | null = null;

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          subscription = await stripe.subscriptions.retrieve(subId);
        }
      } else {
        subscription = event.data.object as Stripe.Subscription;
      }

      if (subscription) {
        const uid = await resolveFirebaseUid(stripe, subscription);
        if (uid) {
          const customerId =
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id;
          const status = subscription.status;
          const isPaid = status === "active" || status === "trialing";
          const plan = isPaid ? "pro" : "free";

          await db.doc(`users/${uid}/billing/subscription`).set(
            {
              plan,
              status,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id,
              currentPeriodEnd: toIso(subscription.current_period_end),
              cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          await db.doc(`users/${uid}/resumes/default`).set(
            {
              subscriptionPlan: plan,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          await db.doc(`stripeWebhookLogs/${event.id}`).set(
            {
              eventId: event.id,
              type: event.type,
              uid,
              status,
              plan,
              processedAt: new Date().toISOString(),
              durationMs: Date.now() - startedAt,
            },
            { merge: true }
          );
        }
      }
    }
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    await db.doc(`stripeWebhookLogs/${event.id}`).set(
      {
        eventId: event.id,
        type: event.type,
        error: error instanceof Error ? error.message : String(error),
        processedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
