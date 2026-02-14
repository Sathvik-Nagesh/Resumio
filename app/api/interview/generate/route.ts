import { NextRequest, NextResponse } from "next/server";

import { runGeminiPromptAsJson } from "@/lib/gemini";
import { buildInterviewQuestionPrompt } from "@/lib/prompts";
import { normalizeResume } from "@/lib/resume";
import { getDecodedToken } from "@/lib/server/auth";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { interviewGenerateSchema } from "@/lib/server/validation";
import type { InterviewQuestion, ResumeData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "interview_generate_ip_burst",
    limit: 12,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many interview generation requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = interviewGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid interview generation request." }, { status: 400 });
    }

    const decoded = await getDecodedToken(request);
    if (decoded?.uid) {
      const pro = await isProPlan(decoded.uid);
      const quota = enforceSubjectRateLimit({
        subject: `uid:${decoded.uid}`,
        key: "interview_generate_uid_window",
        limit: pro ? 80 : 25,
        windowMs: 60 * 60 * 1000,
      });
      if (!quota.allowed) {
        return rateLimitErrorResponse({
          message: "Interview generation limit reached for this hour.",
          limit: quota.limit,
          resetAt: quota.resetAt,
        });
      }
    }

    const normalized = normalizeResume(parsed.data.resume as unknown as ResumeData);
    const prompt = buildInterviewQuestionPrompt({
      role: parsed.data.role,
      company: parsed.data.company,
      jobDescription: parsed.data.jobDescription,
      resumeSummary: normalized.summary,
      skills: normalized.skills.flatMap((group) => group.skills).slice(0, 20),
    });

    const questions = await runGeminiPromptAsJson<InterviewQuestion[]>(prompt);
    return NextResponse.json({
      questions: Array.isArray(questions) ? questions.slice(0, 8) : [],
    });
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return NextResponse.json({ error: "Failed to generate interview questions." }, { status: 500 });
  }
}
