import { ResumeData, AtsScoreResponse } from "@/lib/types";
import {
  ACTION_VERBS,
  ATS_KEYWORD_SYNONYMS,
  METRIC_REGEX,
  REQUIRED_SECTIONS,
  ROLE_PROFILE_KEYWORDS,
} from "@/lib/constants";

const normalize = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const tokenSplitRegex = /[^a-z0-9+#.]+/g;

const stem = (token: string) => {
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1);
  return token;
};

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(tokenSplitRegex)
    .map((token) => stem(token.trim()))
    .filter(Boolean);

const toTokenSet = (text: string) => new Set(tokenize(text));

const hasActionVerb = (bullet: string) => {
  const firstWord = stem((bullet.trim().split(/\s+/)[0] || "").toLowerCase());
  return ACTION_VERBS.some((verb) => stem(verb.toLowerCase()) === firstWord);
};

const hasMetric = (text: string) => METRIC_REGEX.test(text);

const detectRoleProfile = (resume: ResumeData, jobDescription?: string) => {
  const haystack = `${resume.contact.title} ${jobDescription || ""}`.toLowerCase();
  const scores = Object.entries(ROLE_PROFILE_KEYWORDS).map(([profile, keywords]) => ({
    profile,
    score: keywords.filter((keyword) => haystack.includes(keyword.toLowerCase())).length,
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.score > 0 ? scores[0].profile : "general";
};

const expandKeyword = (keyword: string) => {
  const normalized = keyword.toLowerCase().trim();
  const direct = ATS_KEYWORD_SYNONYMS[normalized] || [];
  const reverse = Object.entries(ATS_KEYWORD_SYNONYMS)
    .filter(([, synonyms]) => synonyms.some((item) => item.toLowerCase() === normalized))
    .map(([root]) => root);
  return Array.from(new Set([normalized, ...direct.map((d) => d.toLowerCase()), ...reverse]));
};

const computeParseConfidence = (resume: ResumeData) => {
  const contactSignals = ["name", "email", "phone", "title"].filter(
    (key) => Boolean(resume.contact[key as keyof ResumeData["contact"]])
  ).length;
  const expSignals = resume.experience.filter((item) => item.role && item.company).length;
  const skillSignals = resume.skills.reduce((acc, group) => acc + group.skills.length, 0);
  const total = contactSignals * 12 + expSignals * 14 + Math.min(40, skillSignals * 2);
  return normalize(total);
};

export const computeAtsScore = (resume: ResumeData, jobDescription?: string): AtsScoreResponse => {
  const explanation: string[] = [];
  const sectionPenalties: string[] = [];
  let keywordMatches: string[] = [];
  let missingKeywords: string[] = [];

  const roleProfile = detectRoleProfile(resume, jobDescription);

  const structureScore = (() => {
    const present = REQUIRED_SECTIONS.filter((section) => {
      const value = resume[section as keyof ResumeData];
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    });
    const ratio = present.length / REQUIRED_SECTIONS.length;
    if (ratio < 1) {
      explanation.push("Add missing core sections like summary, experience, education, and skills.");
      sectionPenalties.push("Structure: missing one or more core sections.");
    }

    const contactPenalty = ["email", "phone", "name"].filter(
      (key) => !resume.contact[key as keyof ResumeData["contact"]]
    ).length;
    if (contactPenalty > 0) {
      sectionPenalties.push("Structure: missing required contact fields (name/email/phone).");
    }

    return normalize(ratio * 100 - contactPenalty * 8);
  })();

  const keywordScore = (() => {
    if (!jobDescription) {
      explanation.push("Paste a job description to unlock personalized keyword analysis.");
      sectionPenalties.push("Keywords: job description not provided.");
      return 65;
    }

    const jdTokens = tokenize(jobDescription).filter((token) => token.length > 2);
    const jdSet = new Set(jdTokens);
    const resumeCorpus = [
      resume.summary,
      resume.experience.map((exp) => `${exp.role} ${exp.company} ${exp.bullets.join(" ")}`).join(" "),
      resume.skills.map((group) => group.skills.join(" ")).join(" "),
      resume.projects.map((project) => `${project.name} ${project.technologies.join(" ")}`).join(" "),
    ].join(" ");
    const resumeSet = toTokenSet(resumeCorpus);

    const matches = new Set<string>();
    jdSet.forEach((token) => {
      const variants = expandKeyword(token).map((item) => stem(item));
      if (variants.some((variant) => resumeSet.has(variant))) {
        matches.add(token);
      }
    });

    const profileKeywords = ROLE_PROFILE_KEYWORDS[roleProfile] || [];
    const profileHits = profileKeywords.filter((keyword) =>
      expandKeyword(keyword).some((variant) => resumeSet.has(stem(variant)))
    ).length;

    if (matches.size < 8) {
      explanation.push("Infuse more role-specific keywords from the job description into bullets and skills.");
      sectionPenalties.push("Keywords: low keyword overlap with target role.");
    }
    if (profileKeywords.length > 0 && profileHits < Math.ceil(profileKeywords.length * 0.35)) {
      explanation.push(`Strengthen ${roleProfile} signals with deeper role-specific tooling and domain terms.`);
      sectionPenalties.push(`Keywords: weak ${roleProfile} profile keyword coverage.`);
    }

    keywordMatches = Array.from(matches).slice(0, 16);
    missingKeywords = Array.from(jdSet).filter((token) => !matches.has(token)).slice(0, 18);
    const baseline = (matches.size / Math.max(jdSet.size, 1)) * 100;
    const profileBoost = profileKeywords.length ? (profileHits / profileKeywords.length) * 18 : 10;
    return normalize(baseline + profileBoost);
  })();

  const impactScore = (() => {
    const bullets = resume.experience.flatMap((exp) => exp.bullets).filter(Boolean);
    if (!bullets.length) {
      explanation.push("Add bullet points under experience to highlight impact.");
      sectionPenalties.push("Impact: no experience bullets found.");
      return 35;
    }

    const verbCount = bullets.filter(hasActionVerb).length;
    const metricCount = bullets.filter((bullet) => hasMetric(bullet)).length;
    const shortBullets = bullets.filter((bullet) => tokenize(bullet).length < 8).length;
    const weakBullets = bullets.filter((bullet) => !hasActionVerb(bullet) && !hasMetric(bullet)).length;

    if (verbCount / bullets.length < 0.7) {
      explanation.push("Start more bullets with strong action verbs.");
      sectionPenalties.push("Impact: too few bullets start with action verbs.");
    }
    if (metricCount / bullets.length < 0.4) {
      explanation.push("Quantify achievements with numbers, percentages, or revenue/time saved.");
      sectionPenalties.push("Impact: too few measurable outcomes in bullets.");
    }
    if (shortBullets / bullets.length > 0.35) {
      explanation.push("Expand short bullets with context, actions, and outcomes (STAR-style).");
      sectionPenalties.push("Impact: many bullets are too short/low-context.");
    }
    if (weakBullets / bullets.length > 0.3) {
      explanation.push("Reduce generic bullets and emphasize ownership + measurable outcomes.");
      sectionPenalties.push("Impact: many bullets are generic and non-specific.");
    }

    const verbScore = (verbCount / bullets.length) * 42;
    const metricScore = (metricCount / bullets.length) * 42;
    const clarityScore = Math.max(0, 16 - (shortBullets / bullets.length) * 16);
    return normalize(verbScore + metricScore + clarityScore);
  })();

  const qualityScore = (() => {
    const summaryWords = tokenize(resume.summary).length;
    const projectsWithTech = resume.projects.filter((project) => project.technologies.length > 0).length;
    const expWithTech = resume.experience.filter((item) => (item.technologies || []).length > 0).length;

    let score = 55;
    if (summaryWords >= 25) score += 12;
    if (summaryWords >= 45) score += 8;
    score += Math.min(12, projectsWithTech * 4);
    score += Math.min(13, expWithTech * 3);

    if (summaryWords < 18) {
      explanation.push("Strengthen the summary with role scope, years of experience, and one measurable win.");
      sectionPenalties.push("Quality: summary is too short or generic.");
    }

    return normalize(score);
  })();

  const parseConfidence = computeParseConfidence(resume);
  if (parseConfidence < 60) {
    explanation.push("Parsing confidence is moderate. Review contact fields and section structure for accuracy.");
    sectionPenalties.push("Parse: moderate confidence in extracted structure.");
  }

  const roleWeights: Record<string, { structure: number; keywords: number; impact: number; quality: number }> = {
    security: { structure: 0.22, keywords: 0.36, impact: 0.28, quality: 0.14 },
    data: { structure: 0.2, keywords: 0.38, impact: 0.25, quality: 0.17 },
    frontend: { structure: 0.2, keywords: 0.34, impact: 0.28, quality: 0.18 },
    backend: { structure: 0.2, keywords: 0.35, impact: 0.28, quality: 0.17 },
    devops: { structure: 0.2, keywords: 0.37, impact: 0.28, quality: 0.15 },
    product: { structure: 0.24, keywords: 0.31, impact: 0.25, quality: 0.2 },
    general: { structure: 0.24, keywords: 0.31, impact: 0.28, quality: 0.17 },
  };

  const weights = roleWeights[roleProfile] || roleWeights.general;
  const weightedCore =
    structureScore * weights.structure +
    keywordScore * weights.keywords +
    impactScore * weights.impact +
    qualityScore * weights.quality;

  const confidenceAdjustment = (parseConfidence - 70) * 0.06;
  const score = normalize(weightedCore + confidenceAdjustment);

  return {
    score,
    breakdown: {
      structure: structureScore,
      keywords: keywordScore,
      impact: impactScore,
      quality: qualityScore,
      parseConfidence,
      roleProfile,
      explanation: Array.from(new Set(explanation)).slice(0, 8),
      keywordMatches,
      missingKeywords,
      sectionPenalties: Array.from(new Set(sectionPenalties)).slice(0, 10),
      weights,
    },
  };
};
