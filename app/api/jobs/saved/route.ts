import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { savedJobCreateSchema, savedJobStatusSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

const collectionPath = (uid: string) => `users/${uid}/copilotSavedJobs`;

export async function GET(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "saved_jobs_get_ip_burst",
    limit: 80,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many saved jobs requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = enforceSubjectRateLimit({
    subject: `uid:${decoded.uid}`,
    key: "saved_jobs_get_uid_window",
    limit: 200,
    windowMs: 60 * 60 * 1000,
  });
  if (!quota.allowed) {
    return rateLimitErrorResponse({
      message: "Saved jobs read limit reached.",
      limit: quota.limit,
      resetAt: quota.resetAt,
    });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const snap = await db.collection(collectionPath(decoded.uid)).orderBy("updatedAt", "desc").limit(200).get();
  const items = snap.docs.map((doc) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      uid: decoded.uid,
      status: data.status || "saved",
      matchScore: data.matchScore || 0,
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
      missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
      job: data.job,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "saved_jobs_post_ip_burst",
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many save job requests.",
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
  const parsed = savedJobCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid saved job payload." }, { status: 400 });
  }

  const id = `${parsed.data.job.source}-${parsed.data.job.id}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
  const ref = db.doc(`${collectionPath(decoded.uid)}/${id}`);

  const now = new Date().toISOString();
  await ref.set(
    {
      uid: decoded.uid,
      status: "saved",
      matchScore: Math.round(parsed.data.matchScore),
      reasons: parsed.data.reasons,
      missingSkills: parsed.data.missingSkills,
      job: parsed.data.job,
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
    key: "saved_jobs_patch_ip_burst",
    limit: 80,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many status update requests.",
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
  const parsed = savedJobStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status update payload." }, { status: 400 });
  }

  const ref = db.doc(`${collectionPath(decoded.uid)}/${parsed.data.id}`);
  await ref.set(
    {
      status: parsed.data.status,
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
