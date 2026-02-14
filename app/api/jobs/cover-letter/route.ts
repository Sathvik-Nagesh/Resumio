import { NextRequest, NextResponse } from "next/server";

import { runGeminiPrompt } from "@/lib/gemini";
import { buildCoverLetterPrompt } from "@/lib/prompts";
import { normalizeResume } from "@/lib/resume";
import { getDecodedToken } from "@/lib/server/auth";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { coverLetterSchema } from "@/lib/server/validation";
import type { ResumeData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "job_cover_letter_ip_burst",
    limit: 12,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many cover letter requests. Please slow down.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = coverLetterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cover letter request." }, { status: 400 });
    }

    const decoded = await getDecodedToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const pro = await isProPlan(decoded.uid);
    if (!pro) {
      return NextResponse.json(
        { error: "Cover Letter Copilot is part of Pro. Free tools are still available anytime." },
        { status: 402 }
      );
    }
    const quota = enforceSubjectRateLimit({
      subject: `uid:${decoded.uid}`,
      key: "job_cover_letter_uid_window",
      limit: 80,
      windowMs: 60 * 60 * 1000,
    });
    if (!quota.allowed) {
      return rateLimitErrorResponse({
        message: "Cover letter limit reached for this hour.",
        limit: quota.limit,
        resetAt: quota.resetAt,
      });
    }

    const { resume, job } = parsed.data;
    const normalized = normalizeResume(resume as unknown as ResumeData);
    const coverLetter = await runGeminiPrompt(
      buildCoverLetterPrompt({
        name: normalized.contact.name,
        role: job.title,
        company: job.company,
        resumeSummary: normalized.summary,
        keySkills: normalized.skills.flatMap((group) => group.skills).slice(0, 15),
        jobDescription: job.description,
      })
    );

    return NextResponse.json({ coverLetter: coverLetter.trim() });
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return NextResponse.json({ error: "Failed to generate cover letter." }, { status: 500 });
  }
}
