import { NextRequest, NextResponse } from "next/server";
import { extractTextFromBuffer } from "@/lib/parseResume";
import { buildResumeExtractionPrompt } from "@/lib/prompts";
import { runGeminiFileTextExtraction, runGeminiPromptAsJson } from "@/lib/gemini";
import { computeAtsScore } from "@/lib/ats";
import { refineAtsScoreWithAi } from "@/lib/ats-ai";
import { normalizeResume } from "@/lib/resume";
import { ResumeData } from "@/lib/types";
import { enforceIpRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const burst = enforceIpRateLimit(request, {
      key: "api_parse_resume_burst",
      limit: 5,
      windowMs: 60 * 1000,
    });
    if (!burst.allowed) {
      return rateLimitErrorResponse({
        message: "Too many parse requests. Please slow down.",
        limit: burst.limit,
        resetAt: burst.resetAt,
      });
    }

    const hourly = enforceIpRateLimit(request, {
      key: "api_parse_resume_hourly",
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!hourly.allowed) {
      return rateLimitErrorResponse({
        message: "Hourly parse limit reached. Please try again later.",
        limit: hourly.limit,
        resetAt: hourly.resetAt,
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const jobDescription = formData.get("jobDescription") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File is too large. Please upload files up to 5MB." },
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

    // Extract text from PDF/DOCX/plain text. If extraction is weak, use Gemini OCR fallback.
    let rawText = await extractTextFromBuffer(buffer, file.type, file.name);
    const tooShort = !rawText || rawText.trim().length < 80;
    const canUseOcrFallback =
      file.type.includes("pdf") ||
      file.type.startsWith("image/") ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".png") ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg");

    if (tooShort && canUseOcrFallback) {
      try {
        rawText = await runGeminiFileTextExtraction({
          buffer,
          mimeType: file.type || "application/pdf",
          filename: file.name,
        });
      } catch {
        // Keep raw extraction if OCR fallback fails.
      }
    }

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
    const baseAtsScore = computeAtsScore(resume, jobDescription || undefined);
    const atsScore = await refineAtsScoreWithAi(baseAtsScore, resume, jobDescription || undefined);

    return NextResponse.json({
      resume,
      atsScore,
    });
  } catch (error) {
    console.error("Error parsing resume:", error);
    return NextResponse.json(
      { error: "Failed to parse resume. Please verify the file format and try again." },
      { status: 500 }
    );
  }
}
