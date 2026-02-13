import { NextRequest, NextResponse } from "next/server";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { isAdminUser } from "@/lib/server/admin";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

type VariantKey = "a" | "b" | "unknown";

interface VariantStats {
  pricingViews: number;
  checkoutStarts: number;
  checkoutSuccess: number;
  conversionRate: number;
}

const asNumber = (value: unknown) => (typeof value === "number" ? value : 0);

export async function GET(request: NextRequest) {
  const ipBurst = enforceIpRateLimit(request, {
    key: "admin_metrics_ip_burst",
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!ipBurst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many admin metrics requests. Please slow down.",
      limit: ipBurst.limit,
      resetAt: ipBurst.resetAt,
    });
  }

  const decoded = await getDecodedToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userLimit = enforceSubjectRateLimit({
    subject: `uid:${decoded.uid}`,
    key: "admin_metrics_uid_hourly",
    limit: 180,
    windowMs: 60 * 60 * 1000,
  });
  if (!userLimit.allowed) {
    return rateLimitErrorResponse({
      message: "Admin metrics request limit reached.",
      limit: userLimit.limit,
      resetAt: userLimit.resetAt,
    });
  }
  if (!isAdminUser(decoded)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Admin datastore unavailable" }, { status: 503 });
  }

  const daysRaw = Number(request.nextUrl.searchParams.get("days") || "14");
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(Math.floor(daysRaw), 1), 90) : 14;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const analyticsSnap = await db
    .collection("analyticsEvents")
    .where("ts", ">=", since)
    .orderBy("ts", "desc")
    .limit(5000)
    .get();

  const webhookSnap = await db
    .collection("stripeWebhookLogs")
    .where("processedAt", ">=", since)
    .orderBy("processedAt", "desc")
    .limit(3000)
    .get();

  const totals = {
    pricingViews: 0,
    checkoutStarts: 0,
    checkoutSuccess: 0,
    checkoutCancel: 0,
    paywallHits: 0,
    exportSuccess: 0,
  };

  const variants: Record<VariantKey, VariantStats> = {
    a: { pricingViews: 0, checkoutStarts: 0, checkoutSuccess: 0, conversionRate: 0 },
    b: { pricingViews: 0, checkoutStarts: 0, checkoutSuccess: 0, conversionRate: 0 },
    unknown: { pricingViews: 0, checkoutStarts: 0, checkoutSuccess: 0, conversionRate: 0 },
  };

  const daily = new Map<
    string,
    {
      pricingViews: number;
      checkoutStarts: number;
      checkoutSuccess: number;
      paywallHits: number;
    }
  >();

  analyticsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const event = String(data.event || "");
    const variant = (String(data.variant || "unknown") as VariantKey) || "unknown";
    const ts = String(data.ts || "");
    const day = ts.slice(0, 10) || "unknown";

    if (!daily.has(day)) {
      daily.set(day, { pricingViews: 0, checkoutStarts: 0, checkoutSuccess: 0, paywallHits: 0 });
    }
    const bucket = daily.get(day)!;

    if (event === "pricing_view") {
      totals.pricingViews += 1;
      variants[variant in variants ? variant : "unknown"].pricingViews += 1;
      bucket.pricingViews += 1;
    } else if (event === "checkout_start") {
      totals.checkoutStarts += 1;
      variants[variant in variants ? variant : "unknown"].checkoutStarts += 1;
      bucket.checkoutStarts += 1;
    } else if (event === "checkout_success") {
      totals.checkoutSuccess += 1;
      variants[variant in variants ? variant : "unknown"].checkoutSuccess += 1;
      bucket.checkoutSuccess += 1;
    } else if (event === "checkout_cancel") {
      totals.checkoutCancel += 1;
    } else if (event === "paywall_hit") {
      totals.paywallHits += 1;
      bucket.paywallHits += 1;
    } else if (event === "export_success") {
      totals.exportSuccess += 1;
    }
  });

  (Object.keys(variants) as VariantKey[]).forEach((key) => {
    const stat = variants[key];
    stat.conversionRate =
      stat.pricingViews > 0 ? Number(((stat.checkoutSuccess / stat.pricingViews) * 100).toFixed(2)) : 0;
  });

  const webhook = {
    total: webhookSnap.size,
    failures: 0,
    avgDurationMs: 0,
  };

  let durationSum = 0;
  let durationCount = 0;
  webhookSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.error) webhook.failures += 1;
    const duration = asNumber(data.durationMs);
    if (duration > 0) {
      durationSum += duration;
      durationCount += 1;
    }
  });
  webhook.avgDurationMs = durationCount ? Number((durationSum / durationCount).toFixed(2)) : 0;

  const sortedDaily = Array.from(daily.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, ...value }));

  const funnel = {
    pricingViews: totals.pricingViews,
    checkoutStarts: totals.checkoutStarts,
    checkoutSuccess: totals.checkoutSuccess,
    visitToStartRate:
      totals.pricingViews > 0 ? Number(((totals.checkoutStarts / totals.pricingViews) * 100).toFixed(2)) : 0,
    visitToPaidRate:
      totals.pricingViews > 0 ? Number(((totals.checkoutSuccess / totals.pricingViews) * 100).toFixed(2)) : 0,
    startToPaidRate:
      totals.checkoutStarts > 0 ? Number(((totals.checkoutSuccess / totals.checkoutStarts) * 100).toFixed(2)) : 0,
  };

  return NextResponse.json({
    windowDays: days,
    since,
    totals,
    funnel,
    variants,
    daily: sortedDaily,
    webhook,
    sampleSize: {
      analyticsEvents: analyticsSnap.size,
      webhookLogs: webhookSnap.size,
    },
  });
}
