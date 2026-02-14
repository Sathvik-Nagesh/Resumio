import { NextRequest, NextResponse } from "next/server";

import { getDecodedToken } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "app_analytics_ip_burst",
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many analytics requests.",
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
    key: "app_analytics_uid_window",
    limit: 300,
    windowMs: 60 * 60 * 1000,
  });
  if (!quota.allowed) {
    return rateLimitErrorResponse({
      message: "Analytics query limit reached.",
      limit: quota.limit,
      resetAt: quota.resetAt,
    });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const jobsSnap = await db.collection(`users/${decoded.uid}/copilotSavedJobs`).get();
  const jobs = jobsSnap.docs.map((doc) => doc.data() || {});

  const totals = {
    tracked: jobs.length,
    saved: jobs.filter((item) => item.status === "saved").length,
    applied: jobs.filter((item) => item.status === "applied").length,
    interview: jobs.filter((item) => item.status === "interview").length,
    rejected: jobs.filter((item) => item.status === "rejected").length,
  };

  const applyRate = totals.tracked > 0 ? Math.round((totals.applied / totals.tracked) * 100) : 0;
  const interviewRate = totals.applied > 0 ? Math.round((totals.interview / totals.applied) * 100) : 0;

  const companyCounts = new Map<string, number>();
  for (const item of jobs) {
    const company = item?.job?.company;
    if (typeof company !== "string" || !company) continue;
    companyCounts.set(company, (companyCounts.get(company) || 0) + 1);
  }

  const topCompanies = Array.from(companyCounts.entries())
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const suggestions: string[] = [];
  if (totals.tracked >= 10 && totals.applied < 3) {
    suggestions.push("You are saving many jobs but applying to few. Set a daily apply target of 3 to improve outcomes.");
  }
  if (totals.applied >= 5 && totals.interview === 0) {
    suggestions.push("Your interview conversion is low. Tailor each resume to the JD and use Cover Letter Copilot before applying.");
  }
  if (totals.rejected > totals.interview) {
    suggestions.push("Rejection count is high. Focus on roles with higher match score and rehearse with Interview Copilot.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Momentum looks healthy. Keep applying to high-match roles and track weekly interview conversion.");
  }

  return NextResponse.json({
    totals,
    rates: {
      applyRate,
      interviewRate,
    },
    topCompanies,
    suggestions,
  });
}
