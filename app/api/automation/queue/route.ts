import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { autoApplyQueueCreateSchema, autoApplyQueueStatusSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

const queuePath = (uid: string) => `users/${uid}/automationQueue`;

export async function GET(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "automation_queue_get_ip_burst",
    limit: 80,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many automation queue requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pro = await isProPlan(decoded.uid);
  if (!pro) {
    return NextResponse.json(
      { error: "Approval queue automation is part of Pro. You can keep using free tracking tools." },
      { status: 402 }
    );
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  const snap = await db.collection(queuePath(decoded.uid)).orderBy("updatedAt", "desc").limit(100).get();
  const items = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "automation_queue_post_ip_burst",
    limit: 80,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many queue write requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pro = await isProPlan(decoded.uid);
  if (!pro) {
    return NextResponse.json(
      { error: "Approval queue automation is part of Pro. You can keep using free tracking tools." },
      { status: 402 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = autoApplyQueueCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid queue item payload." }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  const id = `${parsed.data.job.source}-${parsed.data.job.id}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
  const now = new Date().toISOString();

  await db.doc(`${queuePath(decoded.uid)}/${id}`).set(
    {
      uid: decoded.uid,
      status: "pending",
      job: parsed.data.job,
      matchScore: Math.round(parsed.data.matchScore),
      createdAt: now,
      updatedAt: now,
      serverUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, id });
}

export async function PATCH(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "automation_queue_patch_ip_burst",
    limit: 80,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many queue status updates.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pro = await isProPlan(decoded.uid);
  if (!pro) {
    return NextResponse.json(
      { error: "Approval queue automation is part of Pro. You can keep using free tracking tools." },
      { status: 402 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = autoApplyQueueStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid queue status payload." }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  await db.doc(`${queuePath(decoded.uid)}/${parsed.data.id}`).set(
    {
      status: parsed.data.status,
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
