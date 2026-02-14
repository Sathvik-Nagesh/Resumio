import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { interviewSessionUpsertSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

const collectionPath = (uid: string) => `users/${uid}/interviewSessions`;

export async function GET(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "interview_sessions_get_ip_burst",
    limit: 80,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many interview session requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pro = await isProPlan(decoded.uid);
  if (!pro) {
    return NextResponse.json(
      { error: "Saved interview sessions are part of Pro. You can still run free interview generation." },
      { status: 402 }
    );
  }

  const quota = enforceSubjectRateLimit({
    subject: `uid:${decoded.uid}`,
    key: "interview_sessions_get_uid_window",
    limit: 300,
    windowMs: 60 * 60 * 1000,
  });
  if (!quota.allowed) {
    return rateLimitErrorResponse({
      message: "Interview session read limit reached.",
      limit: quota.limit,
      resetAt: quota.resetAt,
    });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const snap = await db.collection(collectionPath(decoded.uid)).orderBy("updatedAt", "desc").limit(50).get();
  const items = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "interview_sessions_post_ip_burst",
    limit: 80,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many interview session writes.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pro = await isProPlan(decoded.uid);
  if (!pro) {
    return NextResponse.json(
      { error: "Saved interview sessions are part of Pro. You can still run free interview generation." },
      { status: 402 }
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = interviewSessionUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid interview session payload." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const ref = db.doc(`${collectionPath(decoded.uid)}/${parsed.data.id}`);
  await ref.set(
    {
      uid: decoded.uid,
      role: parsed.data.role,
      company: parsed.data.company,
      jobDescription: parsed.data.jobDescription,
      questions: parsed.data.questions,
      answers: parsed.data.answers,
      scores: parsed.data.scores,
      createdAt: now,
      updatedAt: now,
      serverUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, id: parsed.data.id });
}
