import { NextRequest, NextResponse } from "next/server";

import { getDecodedToken } from "@/lib/server/auth";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { getUserSubscription } from "@/lib/server/subscription";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ipBurst = enforceIpRateLimit(request, {
    key: "billing_me_ip_burst",
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!ipBurst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many billing status requests. Please slow down.",
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
    key: "billing_me_uid_hourly",
    limit: 300,
    windowMs: 60 * 60 * 1000,
  });
  if (!userHourly.allowed) {
    return rateLimitErrorResponse({
      message: "Billing status request limit reached.",
      limit: userHourly.limit,
      resetAt: userHourly.resetAt,
    });
  }

  const subscription = await getUserSubscription(decoded.uid);
  return NextResponse.json(subscription);
}
