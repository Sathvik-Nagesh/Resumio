import { NextRequest, NextResponse } from "next/server";
import { buildImprovePrompt } from "@/lib/prompts";
import { runGeminiPrompt } from "@/lib/gemini";
import { getDecodedToken } from "@/lib/server/auth";
import { isProPlan } from "@/lib/server/subscription";
import { consumeIpUsage, consumeUserUsage } from "@/lib/server/usage";
import { aiImproveSchema } from "@/lib/server/validation";
import { enforceIpRateLimit, enforceSubjectRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
    try {
        // Validate Gemini API key early to fail fast with a clear error for clients
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey || !geminiKey.trim() || /YOUR[_-]?API[_-]?KEY/i.test(geminiKey)) {
            console.error("GEMINI_API_KEY is missing or appears to be a placeholder.");
            return NextResponse.json({ error: "Missing Gemini API key" }, { status: 401 });
        }

        const decoded = await getDecodedToken(request);
        const uid = decoded?.uid;
        const isPro = uid ? await isProPlan(uid) : false;
        if (uid) {
            const burst = enforceSubjectRateLimit({
                subject: `uid:${uid}`,
                key: "ai_improve_burst",
                limit: isPro ? 25 : 12,
                windowMs: 60 * 1000,
            });
            if (!burst.allowed) {
                return rateLimitErrorResponse({
                    message: "Too many AI improve requests. Please slow down.",
                    limit: burst.limit,
                    resetAt: burst.resetAt,
                });
            }
        } else {
            const burst = enforceIpRateLimit(request, {
                key: "ai_improve_guest_burst",
                limit: 4,
                windowMs: 60 * 1000,
            });
            if (!burst.allowed) {
                return rateLimitErrorResponse({
                    message: "Too many guest AI improve requests. Please slow down.",
                    limit: burst.limit,
                    resetAt: burst.resetAt,
                });
            }
        }

        if (!isPro) {
            if (uid) {
                const usage = await consumeUserUsage({
                    uid,
                    key: "ai_improve",
                    limit: 20,
                });
                if (!usage.allowed) {
                    return NextResponse.json(
                        { error: "Free AI improvement limit reached for today. Upgrade to Pro for unlimited refinements." },
                        { status: 429 }
                    );
                }
            } else {
                const ip = (request.headers.get("x-forwarded-for") || "anonymous").split(",")[0].trim();
                const usage = consumeIpUsage({
                    ip,
                    key: "ai_improve_guest",
                    limit: 5,
                    windowMs: 24 * 60 * 60 * 1000,
                });
                if (!usage.allowed) {
                    return NextResponse.json(
                        { error: "Guest AI refinement limit reached. Sign in for more or upgrade to Pro." },
                        { status: 429 }
                    );
                }
            }
        }

        const body = await request.json().catch(() => ({}));
        const parsed = aiImproveSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input for AI improvement request." },
                { status: 400 }
            );
        }
        const { mode, tone, text, context } = parsed.data;

        if (!text || !mode) {
            return NextResponse.json(
                { error: "Missing required fields: text and mode" },
                { status: 400 }
            );
        }

        const prompt = buildImprovePrompt({ mode, tone, text, context });
        const improvedText = await runGeminiPrompt(prompt);

        return NextResponse.json({
            improvedText: improvedText.trim(),
        });
    } catch (error) {
        console.error("Error improving text:", error);
        return NextResponse.json(
            { error: "Failed to improve text. Please try again." },
            { status: 500 }
        );
    }
}
