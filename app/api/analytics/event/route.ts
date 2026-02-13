import { NextRequest, NextResponse } from "next/server";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { analyticsEventSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Analytics unavailable" }, { status: 503 });
  }

  const burst = enforceIpRateLimit(request, {
    key: "analytics_event_burst",
    limit: 40,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many analytics events in a short time.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const hourly = enforceIpRateLimit(request, {
    key: "analytics_event_hourly",
    limit: 200,
    windowMs: 60 * 60 * 1000,
  });
  if (!hourly.allowed) {
    return rateLimitErrorResponse({
      message: "Analytics rate limit exceeded.",
      limit: hourly.limit,
      resetAt: hourly.resetAt,
    });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = analyticsEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
  }

  const decoded = await getDecodedToken(request);
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();

  await db.collection("analyticsEvents").add({
    ...parsed.data,
    uid: decoded?.uid || null,
    ip,
    userAgent: request.headers.get("user-agent") || "unknown",
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
