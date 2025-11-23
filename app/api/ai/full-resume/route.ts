import { NextRequest, NextResponse } from "next/server";
import { buildFullResumePrompt } from "@/lib/prompts";
import { runGeminiPromptAsJson } from "@/lib/gemini";
import { normalizeResume } from "@/lib/resume";
import { ResumeData } from "@/lib/types";

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
        const body = await request.json();
        const { name, email, phone, location, role, yearsExp, skills, industry, goals, action } = body;

        if (!role || !skills) {
            return NextResponse.json(
                { error: "Missing required fields: role and skills" },
                { status: 400 }
            );
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
