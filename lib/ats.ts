import { ResumeData, AtsScoreResponse } from "@/lib/types";
import { ACTION_VERBS, METRIC_REGEX, REQUIRED_SECTIONS } from "@/lib/constants";

const normalize = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const hasActionVerb = (bullet: string) => {
  const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase();
  return ACTION_VERBS.some((verb) => verb.toLowerCase() === firstWord);
};

const hasMetric = (text: string) => METRIC_REGEX.test(text);

export const computeAtsScore = (resume: ResumeData, jobDescription?: string): AtsScoreResponse => {
  const explanation: string[] = [];
  let keywordMatches: string[] = [];

  const structureScore = (() => {
    const present = REQUIRED_SECTIONS.filter((section) => Boolean(resume[section as keyof ResumeData]));
    const ratio = present.length / REQUIRED_SECTIONS.length;
    if (ratio < 1) {
      explanation.push("Add missing core sections like summary, experience, education, and skills.");
    }
    return normalize(ratio * 100);
  })();

  const keywordScore = (() => {
    if (!jobDescription) {
      explanation.push("Paste a job description to unlock personalized keyword analysis.");
      return 65;
    }
    const jdTokens = jobDescription
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter(Boolean);
    const jdSet = new Set(jdTokens);
    const resumeTokens = [
      resume.summary,
      resume.experience.map((exp) => `${exp.role} ${exp.company} ${exp.bullets.join(" ")}`).join(" "),
      resume.skills.map((group) => group.skills.join(" ")).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    // Build a Set of normalized resume tokens (word-boundary tokens) to avoid substring matches
    const resumeTokenArr = resumeTokens.split(/[^a-z0-9+#]+/).filter(Boolean);
    const resumeSet = new Set(resumeTokenArr);
    const matches = new Set<string>();
    jdSet.forEach((token) => {
      // only count longer meaningful tokens
      if (token.length > 3 && resumeSet.has(token)) {
        matches.add(token);
      }
    });
    if (matches.size < 5) {
      explanation.push("Infuse more role-specific keywords from the job description into bullets and skills.");
    }
    keywordMatches = Array.from(matches).slice(0, 12);
    return normalize((matches.size / Math.max(jdSet.size, 1)) * 100 + 20);
  })();

  const impactScore = (() => {
    const bullets = resume.experience.flatMap((exp) => exp.bullets);
    if (!bullets.length) {
      explanation.push("Add bullet points under experience to highlight impact.");
      return 40;
    }
    const verbCount = bullets.filter(hasActionVerb).length;
    const metricCount = bullets.filter((bullet) => hasMetric(bullet)).length;
    if (verbCount / bullets.length < 0.7) {
      explanation.push("Start more bullets with strong action verbs.");
    }
    if (metricCount / bullets.length < 0.4) {
      explanation.push("Quantify achievements with numbers, percentages, or revenue/time saved.");
    }
    return normalize(((verbCount + metricCount) / (bullets.length * 2)) * 100 + 25);
  })();

  const score = normalize((structureScore + keywordScore + impactScore) / 3);

  return {
    score,
    breakdown: {
      structure: structureScore,
      keywords: keywordScore,
      impact: impactScore,
      explanation,
      keywordMatches,
    },
  };
};
