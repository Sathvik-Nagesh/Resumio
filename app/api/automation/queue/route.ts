import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { autoApplyQueueCreateSchema, autoApplyQueueStatusSchema } from "@/lib/server/validation";
import {
  approvalsLimitReached,
  DEFAULT_ALLOWED_APPLY_DOMAINS,
  extractHost,
  getDayWindowIso,
  isApplyUrlAllowed,
} from "@/lib/server/automation-guardrails";

export const runtime = "nodejs";

const queuePath = (uid: string) => `users/${uid}/automationQueue`;
const rulePath = (uid: string) => `users/${uid}/automation/config`;
const activityPath = (uid: string) => `users/${uid}/automationActivity`;

const defaultRule = {
  requireApproval: true,
  dryRun: true,
  dailyApprovalLimit: 15,
  allowedDomains: [] as string[],
};

const logAutomationActivity = async (
  uid: string,
  payload: {
    action: "queue_add" | "status_change";
    status: "allowed" | "blocked";
    reason: string;
    queueId?: string;
    targetStatus?: "pending" | "approved" | "rejected";
    host?: string | null;
    dryRun?: boolean;
  }
) => {
  const db = getAdminDb();
  if (!db) return;
  await db.collection(activityPath(uid)).add({
    ...payload,
    createdAt: new Date().toISOString(),
    serverCreatedAt: FieldValue.serverTimestamp(),
  });
};

const readRule = async (uid: string) => {
  const db = getAdminDb();
  if (!db) return defaultRule;
  const snap = await db.doc(rulePath(uid)).get();
  const data = snap.data() || {};
  return {
    requireApproval: data.requireApproval !== false,
    dryRun: data.dryRun !== false,
    dailyApprovalLimit: typeof data.dailyApprovalLimit === "number" ? data.dailyApprovalLimit : 15,
    allowedDomains: Array.isArray(data.allowedDomains) ? data.allowedDomains : [],
  };
};

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
  const activitySnap = await db.collection(activityPath(decoded.uid)).orderBy("createdAt", "desc").limit(30).get();
  const activity = activitySnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
  return NextResponse.json({ items, activity });
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
  await logAutomationActivity(decoded.uid, {
    action: "queue_add",
    status: "allowed",
    reason: "Job added to approval queue.",
    queueId: id,
    targetStatus: "pending",
  });

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

  const queueRef = db.doc(`${queuePath(decoded.uid)}/${parsed.data.id}`);
  const queueSnap = await queueRef.get();
  if (!queueSnap.exists) {
    return NextResponse.json({ error: "Queue item not found." }, { status: 404 });
  }

  const queueData = queueSnap.data() || {};
  const job = queueData.job || {};
  const applyUrl = typeof job.applyUrl === "string" ? job.applyUrl : "";
  const rule = await readRule(decoded.uid);

  if (parsed.data.status === "approved") {
    const { startIso } = getDayWindowIso();
    const approvedSnap = await db.collection(queuePath(decoded.uid)).where("status", "==", "approved").limit(300).get();
    const approvalsToday = approvedSnap.docs.filter((doc) => {
      const data = doc.data() || {};
      return typeof data.updatedAt === "string" && data.updatedAt >= startIso;
    }).length;

    if (approvalsLimitReached(approvalsToday, rule.dailyApprovalLimit)) {
      await logAutomationActivity(decoded.uid, {
        action: "status_change",
        status: "blocked",
        reason: `Daily approval limit reached (${rule.dailyApprovalLimit}).`,
        queueId: parsed.data.id,
        targetStatus: parsed.data.status,
      });
      return NextResponse.json(
        { error: "Daily approval limit reached. Increase limit or try tomorrow." },
        { status: 409 }
      );
    }

    const allowlist = rule.allowedDomains.length > 0 ? rule.allowedDomains : DEFAULT_ALLOWED_APPLY_DOMAINS;
    const allowResult = isApplyUrlAllowed(applyUrl, allowlist);
    if (!allowResult.ok) {
      await logAutomationActivity(decoded.uid, {
        action: "status_change",
        status: "blocked",
        reason: "Apply URL domain is not in the allowlist.",
        queueId: parsed.data.id,
        targetStatus: parsed.data.status,
        host: allowResult.host,
      });
      return NextResponse.json(
        { error: "Apply link domain is not allowed by your guardrails." },
        { status: 400 }
      );
    }
  }

  await db.doc(`${queuePath(decoded.uid)}/${parsed.data.id}`).set(
    {
      status: parsed.data.status,
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
      requiresManualApproval: rule.requireApproval !== false,
      executionMode:
        parsed.data.status === "approved"
          ? rule.dryRun !== false
            ? "dry-run"
            : "manual-approved"
          : null,
      dryRun: rule.dryRun !== false,
    },
    { merge: true }
  );
  await logAutomationActivity(decoded.uid, {
    action: "status_change",
    status: "allowed",
    reason:
      parsed.data.status === "approved" && rule.dryRun !== false
        ? "Approved in dry-run mode. No external apply attempt was triggered."
        : `Queue item marked as ${parsed.data.status}.`,
    queueId: parsed.data.id,
    targetStatus: parsed.data.status,
    host: typeof job.applyUrl === "string" ? extractHost(job.applyUrl) : null,
    dryRun: rule.dryRun !== false,
  });

  return NextResponse.json({ ok: true });
}
