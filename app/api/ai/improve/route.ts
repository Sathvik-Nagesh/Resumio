import { NextRequest, NextResponse } from "next/server";
import { buildImprovePrompt } from "@/lib/prompts";
import { runGeminiPrompt } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        // Validate Gemini API key early to fail fast with a clear error for clients
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey || !geminiKey.trim() || /YOUR[_-]?API[_-]?KEY/i.test(geminiKey)) {
            console.error("GEMINI_API_KEY is missing or appears to be a placeholder.");
            return NextResponse.json({ error: "Missing Gemini API key" }, { status: 401 });
        }

        const body = await request.json();
        const { mode, tone, text, context } = body;

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
