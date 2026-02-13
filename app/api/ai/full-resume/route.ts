import { NextRequest, NextResponse } from "next/server";
import { buildFullResumePrompt } from "@/lib/prompts";
import { runGeminiPromptAsJson } from "@/lib/gemini";
import { normalizeResume } from "@/lib/resume";
import { ResumeData } from "@/lib/types";
import { getDecodedToken } from "@/lib/server/auth";
import { isProPlan } from "@/lib/server/subscription";
import { consumeIpUsage, consumeUserUsage } from "@/lib/server/usage";
import { aiFullResumeSchema } from "@/lib/server/validation";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
    try {
        // Fail fast if Gemini API key is not configured or is a placeholder.
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey || !geminiKey.trim() || /YOUR[_-]?API[_-]?KEY/i.test(geminiKey)) {
            console.error("GEMINI_API_KEY is missing or appears to be a placeholder.");
            return NextResponse.json(
                { error: "Gemini API key is missing or invalid. Please set GEMINI_API_KEY in the environment." },
                { status: 500 }
            );
        }
        const body = await request.json().catch(() => ({}));
        const parsed = aiFullResumeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input for AI resume generation request." },
                { status: 400 }
            );
        }
        const { name, email, phone, location, role, yearsExp, skills, industry, goals, action } = parsed.data;
        const decoded = await getDecodedToken(request);
        const uid = decoded?.uid;
        const isPro = uid ? await isProPlan(uid) : false;
        const isRegenerate = action === "regenerate";

        if (uid) {
            const burst = enforceSubjectRateLimit({
                subject: `uid:${uid}`,
                key: "ai_full_resume_burst",
                limit: isPro ? 8 : 4,
                windowMs: 60 * 1000,
            });
            if (!burst.allowed) {
                return rateLimitErrorResponse({
                    message: "Too many AI resume requests. Please slow down.",
                    limit: burst.limit,
                    resetAt: burst.resetAt,
                });
            }
        } else {
            const burst = enforceIpRateLimit(request, {
                key: "ai_full_resume_guest_burst",
                limit: 2,
                windowMs: 10 * 60 * 1000,
            });
            if (!burst.allowed) {
                return rateLimitErrorResponse({
                    message: "Too many guest AI resume requests. Please try later.",
                    limit: burst.limit,
                    resetAt: burst.resetAt,
                });
            }
        }

        if (isRegenerate && !isPro) {
            return NextResponse.json(
                { error: "Section regeneration is a Pro feature. Upgrade to continue." },
                { status: 402 }
            );
        }

        if (!isRegenerate && !isPro) {
            if (uid) {
                const usage = await consumeUserUsage({
                    uid,
                    key: "ai_full_generate",
                    limit: 5,
                });
                if (!usage.allowed) {
                    return NextResponse.json(
                        { error: "Free AI generation limit reached for today. Upgrade to Pro for unlimited access." },
                        { status: 429 }
                    );
                }
            } else {
                const ip = (request.headers.get("x-forwarded-for") || "anonymous").split(",")[0].trim();
                const usage = consumeIpUsage({
                    ip,
                    key: "ai_full_generate_guest",
                    limit: 2,
                    windowMs: 24 * 60 * 60 * 1000,
                });
                if (!usage.allowed) {
                    return NextResponse.json(
                        { error: "Guest AI generation limit reached. Sign in or upgrade to Pro." },
                        { status: 429 }
                    );
                }
            }
        }

        const prompt = buildFullResumePrompt({
            name,
            email,
            phone,
            location,
            role,
            yearsExp: yearsExp || "5",
            skills,
            industry: industry || "Technology",
            goals: goals || "Create an impactful, ATS-friendly resume",
        });

        const generatedResume = await runGeminiPromptAsJson<ResumeData>(prompt);
        const resume = normalizeResume(generatedResume);

        return NextResponse.json({
            resume,
            action: action || "generate",
        });
    } catch (error) {
        console.error("Error generating resume:", error);
        return NextResponse.json(
            { error: "Failed to generate resume. Please try again." },
            { status: 500 }
        );
    }
}
