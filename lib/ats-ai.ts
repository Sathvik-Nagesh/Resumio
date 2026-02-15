import { runGeminiPromptAsJson } from "@/lib/gemini";
import { buildAtsAiReviewPrompt } from "@/lib/prompts";
import { AtsScoreResponse, ResumeData } from "@/lib/types";

interface AtsAiReviewResult {
  adjustment: number;
  confidence: number;
  reasons: string[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export async function refineAtsScoreWithAi(
  baseScore: AtsScoreResponse,
  resume: ResumeData,
  jobDescription?: string
): Promise<AtsScoreResponse> {
  if (!jobDescription || !process.env.GEMINI_API_KEY) {
    return baseScore;
  }

  try {
    const result = await runGeminiPromptAsJson<AtsAiReviewResult>(
      buildAtsAiReviewPrompt({
        resumeSummary: resume.summary,
        resumeTitle: resume.contact.title,
        skills: resume.skills.flatMap((group) => group.skills),
        jobDescription,
        baseScore: baseScore.score,
        breakdown: {
          structure: baseScore.breakdown.structure,
          keywords: baseScore.breakdown.keywords,
          impact: baseScore.breakdown.impact,
          quality: baseScore.breakdown.quality,
        },
      })
    );

    const adjustment = clamp(Math.round(Number(result.adjustment || 0)), -8, 8);
    const score = clamp(baseScore.score + adjustment, 0, 100);
    const confidence = clamp(Math.round(Number(result.confidence || baseScore.breakdown.parseConfidence || 70)), 0, 100);
    const reasons = Array.isArray(result.reasons) ? result.reasons.slice(0, 4).filter(Boolean) : [];

    return {
      ...baseScore,
      score,
      breakdown: {
        ...baseScore.breakdown,
        aiAdjustment: adjustment,
        parseConfidence: confidence,
        explanation: Array.from(new Set([...baseScore.breakdown.explanation, ...reasons])).slice(0, 10),
      },
    };
  } catch {
    return baseScore;
  }
}
