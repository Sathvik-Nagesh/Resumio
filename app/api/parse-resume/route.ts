import { NextRequest, NextResponse } from "next/server";
import { extractTextFromBuffer } from "@/lib/parseResume";
import { buildResumeExtractionPrompt } from "@/lib/prompts";
import { runGeminiPromptAsJson } from "@/lib/gemini";
import { computeAtsScore } from "@/lib/ats";
import { normalizeResume } from "@/lib/resume";
import { ResumeData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const jobDescription = formData.get("jobDescription") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check if API key is set
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add your API key to .env.local" },
        { status: 500 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF or DOCX
    const rawText = await extractTextFromBuffer(buffer, file.type, file.name);

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract meaningful text from the file" },
        { status: 400 }
      );
    }

    // Use Gemini to parse the resume
    const prompt = buildResumeExtractionPrompt(rawText);
    const parsedResume = await runGeminiPromptAsJson<ResumeData>(prompt);

    // Normalize the resume data
    const resume = normalizeResume(parsedResume);

    // Compute ATS score
    const atsScore = computeAtsScore(resume, jobDescription || undefined);

    return NextResponse.json({
      resume,
      atsScore,
    });
  } catch (error) {
    console.error("Error parsing resume:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to parse resume: ${errorMessage}` },
      { status: 500 }
    );
  }
}
