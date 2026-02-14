import { NextRequest, NextResponse } from "next/server";

import { runGeminiPromptAsJson } from "@/lib/gemini";
import { buildTailoredResumePrompt } from "@/lib/prompts";
import { normalizeResume } from "@/lib/resume";
import { getDecodedToken } from "@/lib/server/auth";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { jobTailorSchema } from "@/lib/server/validation";
import type { ResumeData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "job_tailor_ip_burst",
    limit: 12,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many tailoring requests. Please slow down.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = jobTailorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tailoring request." }, { status: 400 });
    }

    const decoded = await getDecodedToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const pro = await isProPlan(decoded.uid);
    if (!pro) {
      return NextResponse.json(
        { error: "Role-tailored resume drafts are part of Pro. You can continue with free matching anytime." },
        { status: 402 }
      );
    }
    const quota = enforceSubjectRateLimit({
      subject: `uid:${decoded.uid}`,
      key: "job_tailor_uid_window",
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });
    if (!quota.allowed) {
      return rateLimitErrorResponse({
        message: "Tailoring limit reached for this hour.",
        limit: quota.limit,
        resetAt: quota.resetAt,
      });
    }

    const { resume, job } = parsed.data;
    const normalized = normalizeResume(resume as unknown as ResumeData);
    const prompt = buildTailoredResumePrompt({
      resumeJson: JSON.stringify(normalized),
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description,
    });

    const tailored = await runGeminiPromptAsJson<ResumeData>(prompt);
    return NextResponse.json({
      resume: normalizeResume(tailored),
      tailoredFor: {
        title: job.title,
        company: job.company,
      },
    });
  } catch (error) {
    console.error("Error tailoring resume:", error);
    return NextResponse.json({ error: "Failed to tailor resume." }, { status: 500 });
  }
}
