import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { jobAlertPreferencesSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

const defaultPrefs = {
  enabled: false,
  email: "",
  frequency: "daily" as const,
  location: "",
  remoteOnly: true,
};

export async function GET(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "job_alert_get_ip_burst",
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many alert preference requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const ref = db.doc(`users/${decoded.uid}/copilot/preferences`);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ preferences: { ...defaultPrefs, email: decoded.email || "" } });
  }

  const data = snap.data() || {};
  return NextResponse.json({
    preferences: {
      enabled: data.enabled === true,
      email: typeof data.email === "string" ? data.email : decoded.email || "",
      frequency: data.frequency === "weekly" ? "weekly" : "daily",
      location: typeof data.location === "string" ? data.location : "",
      remoteOnly: data.remoteOnly !== false,
    },
  });
}

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "job_alert_post_ip_burst",
    limit: 40,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many alert update requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = jobAlertPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid alert preferences." }, { status: 400 });
  }

  const ref = db.doc(`users/${decoded.uid}/copilot/preferences`);
  await ref.set(
    {
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
      uid: decoded.uid,
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, preferences: parsed.data });
}
