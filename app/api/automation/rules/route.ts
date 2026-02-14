import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { autoApplyRuleSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

const defaultRule = {
  enabled: false,
  roles: [],
  locations: [],
  remoteOnly: true,
  minMatchScore: 75,
  requireApproval: true,
  dryRun: true,
  dailyApprovalLimit: 15,
  allowedDomains: [],
};

export async function GET(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "automation_rules_get_ip_burst",
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many automation rule requests.",
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

  const ref = db.doc(`users/${decoded.uid}/automation/config`);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ rule: defaultRule });
  }

  const data = snap.data() || {};
  return NextResponse.json({
    rule: {
      enabled: data.enabled === true,
      roles: Array.isArray(data.roles) ? data.roles : [],
      locations: Array.isArray(data.locations) ? data.locations : [],
      remoteOnly: data.remoteOnly !== false,
      minMatchScore: typeof data.minMatchScore === "number" ? data.minMatchScore : 75,
      requireApproval: data.requireApproval !== false,
      dryRun: data.dryRun !== false,
      dailyApprovalLimit: typeof data.dailyApprovalLimit === "number" ? data.dailyApprovalLimit : 15,
      allowedDomains: Array.isArray(data.allowedDomains) ? data.allowedDomains : [],
    },
  });
}

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "automation_rules_post_ip_burst",
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many automation rule updates.",
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
  const parsed = autoApplyRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid automation rule payload." }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });

  await db.doc(`users/${decoded.uid}/automation/config`).set(
    {
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, rule: parsed.data });
}
