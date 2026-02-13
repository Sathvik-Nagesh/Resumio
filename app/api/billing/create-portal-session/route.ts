import { NextRequest, NextResponse } from "next/server";

import { getDecodedToken } from "@/lib/server/auth";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { getStripeServer } from "@/lib/server/stripe";
import { getUserSubscription } from "@/lib/server/subscription";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ipBurst = enforceIpRateLimit(request, {
    key: "billing_portal_ip_burst",
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!ipBurst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many billing portal requests. Please slow down.",
      limit: ipBurst.limit,
      resetAt: ipBurst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userHourly = enforceSubjectRateLimit({
    subject: `uid:${decoded.uid}`,
    key: "billing_portal_uid_hourly",
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!userHourly.allowed) {
    return rateLimitErrorResponse({
      message: "Billing portal request limit reached.",
      limit: userHourly.limit,
      resetAt: userHourly.resetAt,
    });
  }

  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const subscription = await getUserSubscription(decoded.uid);
  if (!subscription.stripeCustomerId) {
    return NextResponse.json({ error: "No billing profile found." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
