import { NextRequest, NextResponse } from "next/server";

import { buildJobMatches } from "@/lib/server/job-copilot";
import { getDecodedToken } from "@/lib/server/auth";
import { isProPlan } from "@/lib/server/subscription";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { jobMatchRequestSchema } from "@/lib/server/validation";
import type { ResumeData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "job_match_ip_burst",
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many job match requests. Please slow down.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = jobMatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const decoded = await getDecodedToken(request);
    if (decoded?.uid) {
      const pro = await isProPlan(decoded.uid);
      const quota = enforceSubjectRateLimit({
        subject: `uid:${decoded.uid}`,
        key: "job_match_uid_window",
        limit: pro ? 120 : 40,
        windowMs: 60 * 60 * 1000,
      });
      if (!quota.allowed) {
        return rateLimitErrorResponse({
          message: "Job copilot limit reached for this hour.",
          limit: quota.limit,
          resetAt: quota.resetAt,
        });
      }
    }

    const { resume, location, remoteOnly, limit } = parsed.data;
    const normalizedResume: ResumeData = {
      contact: {
        name: "",
        title: resume.contact?.title || "",
        email: "",
        phone: "",
        location: "",
      },
      summary: resume.summary || "",
      experience: (resume.experience || []).map((item, index) => ({
        id: `exp-${index + 1}`,
        role: item.role || "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        bullets: item.bullets || [],
        technologies: item.technologies || [],
      })),
      education: [],
      skills: resume.skills || [],
      projects: [],
      certifications: [],
    };
    const matches = await buildJobMatches(normalizedResume, { location, remoteOnly, limit });

    return NextResponse.json({
      matches,
      generatedAt: new Date().toISOString(),
      total: matches.length,
    });
  } catch (error) {
    console.error("Error generating job matches:", error);
    return NextResponse.json({ error: "Failed to generate job matches." }, { status: 500 });
  }
}
