import { NextRequest, NextResponse } from "next/server";

import { runGeminiPrompt } from "@/lib/gemini";
import { buildNetworkingMessagePrompt } from "@/lib/prompts";
import { normalizeResume } from "@/lib/resume";
import { getDecodedToken } from "@/lib/server/auth";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";
import { isProPlan } from "@/lib/server/subscription";
import { networkingMessageSchema } from "@/lib/server/validation";
import type { ResumeData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const burst = enforceIpRateLimit(request, {
    key: "networking_generate_ip_burst",
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!burst.allowed) {
    return rateLimitErrorResponse({
      message: "Too many networking generation requests.",
      limit: burst.limit,
      resetAt: burst.resetAt,
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = networkingMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid networking request." }, { status: 400 });
    }

    const decoded = await getDecodedToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const pro = await isProPlan(decoded.uid);
    if (!pro) {
      return NextResponse.json(
        { error: "Outreach Copilot is part of Pro. You can keep using free matching and tracking tools." },
        { status: 402 }
      );
    }
    const quota = enforceSubjectRateLimit({
      subject: `uid:${decoded.uid}`,
      key: "networking_generate_uid_window",
      limit: 120,
      windowMs: 60 * 60 * 1000,
    });
    if (!quota.allowed) {
      return rateLimitErrorResponse({
        message: "Networking message limit reached for this hour.",
        limit: quota.limit,
        resetAt: quota.resetAt,
      });
    }

    const normalized = normalizeResume(parsed.data.resume as unknown as ResumeData);
    const text = await runGeminiPrompt(
      buildNetworkingMessagePrompt({
        mode: parsed.data.mode,
        role: parsed.data.role,
        company: parsed.data.company,
        contactName: parsed.data.contactName,
        resumeSummary: normalized.summary,
        highlights: normalized.experience.flatMap((item) => item.bullets).slice(0, 4),
      })
    );

    return NextResponse.json({ message: text.trim() });
  } catch (error) {
    console.error("Error generating networking message:", error);
    return NextResponse.json({ error: "Failed to generate networking message." }, { status: 500 });
  }
}
