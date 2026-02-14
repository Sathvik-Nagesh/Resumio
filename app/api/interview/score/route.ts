import { NextRequest, NextResponse } from "next/server";

import { runGeminiPromptAsJson } from "@/lib/gemini";
import { buildInterviewScorePrompt } from "@/lib/prompts";
import { getDecodedToken } from "@/lib/server/auth";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { interviewScoreSchema } from "@/lib/server/validation";
import type { InterviewAnswerScore } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "interview_score_ip_burst",
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many interview scoring requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = interviewScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid interview score request." }, { status: 400 });
    }

    const decoded = await getDecodedToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const pro = await isProPlan(decoded.uid);
    if (!pro) {
      return NextResponse.json(
        { error: "Interview answer scoring is part of Pro. You can still generate interview sets for free." },
        { status: 402 }
      );
    }
    const quota = enforceSubjectRateLimit({
      subject: `uid:${decoded.uid}`,
      key: "interview_score_uid_window",
      limit: 160,
      windowMs: 60 * 60 * 1000,
    });
    if (!quota.allowed) {
      return rateLimitErrorResponse({
        message: "Interview scoring limit reached for this hour.",
        limit: quota.limit,
        resetAt: quota.resetAt,
      });
    }

    const prompt = buildInterviewScorePrompt(parsed.data);
    const result = await runGeminiPromptAsJson<InterviewAnswerScore>(prompt);

    return NextResponse.json({
      score: Math.max(0, Math.min(100, Math.round(result.score))),
      feedback: result.feedback,
      improvedAnswer: result.improvedAnswer,
    });
  } catch (error) {
    console.error("Error scoring interview answer:", error);
    return NextResponse.json({ error: "Failed to score interview answer." }, { status: 500 });
  }
}
