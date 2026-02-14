import { buildJobMatchPrompt } from "@/lib/prompts";
import { runGeminiPromptAsJson } from "@/lib/gemini";
import { JobListing, JobMatch, ResumeData } from "@/lib/types";

const REMOTIVE_API = "https://remotive.com/api/remote-jobs";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  publication_date: string;
  description: string;
  tags: string[];
  salary?: string;
}

interface RemotiveResponse {
  jobs?: RemotiveJob[];
}

const textTokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const unique = (items: string[]) => Array.from(new Set(items));

export const extractResumeKeywords = (resume: ResumeData): string[] => {
  const title = resume.contact.title || "";
  const skillTokens = resume.skills.flatMap((group) => group.skills);
  const expTokens = resume.experience.flatMap((item) => [
    item.role,
    ...(item.technologies || []),
    ...(item.bullets || []),
  ]);

  return unique([
    ...textTokens(title),
    ...textTokens(resume.summary || ""),
    ...skillTokens.flatMap((skill) => textTokens(skill)),
    ...expTokens.flatMap((token) => textTokens(token || "")),
  ]).filter((token) => token.length > 2).slice(0, 50);
};

export const fetchJobListings = async (searchTerms: string[], limit = 24): Promise<JobListing[]> => {
  const query = encodeURIComponent(searchTerms.slice(0, 8).join(" "));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(`${REMOTIVE_API}?search=${query}`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as RemotiveResponse;
    const jobs = payload.jobs || [];
    return jobs.slice(0, limit).map((job) => ({
      id: String(job.id),
      title: job.title || "Unknown title",
      company: job.company_name || "Unknown company",
      location: job.candidate_required_location || "Remote",
      remote: true,
      applyUrl: job.url,
      source: "Remotive",
      publishedAt: job.publication_date || new Date().toISOString(),
      description: (job.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      tags: job.tags || [],
      salary: job.salary,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
};

const heuristicScore = (resumeKeywords: string[], job: JobListing): JobMatch => {
  const jobText = `${job.title} ${job.company} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
  const keywordHits = unique(resumeKeywords.filter((keyword) => jobText.includes(keyword)));

  const skillAnchors = unique(
    resumeKeywords.filter((token) =>
      ["security", "cloud", "python", "aws", "azure", "gcp", "siem", "network", "linux", "kubernetes"].includes(
        token
      )
    )
  );

  const missing = skillAnchors.filter((token) => !jobText.includes(token)).slice(0, 4);
  const base = Math.min(100, 20 + keywordHits.length * 6 + (job.title.toLowerCase().includes("engineer") ? 6 : 0));
  const reasons = [
    `${keywordHits.slice(0, 4).join(", ") || "Relevant skills"} overlap with this role.`,
    `Role focus aligns with your ${job.title.toLowerCase().includes("security") ? "security" : "technical"} profile.`,
  ];

  return {
    job,
    matchScore: Math.max(10, Math.round(base)),
    reasons,
    missingSkills: missing,
  };
};

const maybeAiRefine = async (resume: ResumeData, matches: JobMatch[]): Promise<JobMatch[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || matches.length === 0) return matches;

  try {
    const aiInput = matches.slice(0, 18).map((item) => ({
      id: item.job.id,
      title: item.job.title,
      company: item.job.company,
      location: item.job.location,
      tags: item.job.tags.slice(0, 8),
      description: item.job.description.slice(0, 600),
    }));

    const prompt = buildJobMatchPrompt({
      resumeSummary: resume.summary || "",
      resumeTitle: resume.contact.title || "",
      resumeSkills: resume.skills.flatMap((group) => group.skills).slice(0, 40),
      jobs: aiInput,
    });

    const scored = await runGeminiPromptAsJson<Array<{ id: string; matchScore: number; reasons: string[]; missingSkills: string[] }>>(
      prompt
    );

    const byId = new Map(scored.map((item) => [item.id, item]));
    return matches.map((item) => {
      const ai = byId.get(item.job.id);
      if (!ai) return item;
      return {
        ...item,
        matchScore: Math.max(0, Math.min(100, Math.round(ai.matchScore ?? item.matchScore))),
        reasons: Array.isArray(ai.reasons) && ai.reasons.length > 0 ? ai.reasons.slice(0, 3) : item.reasons,
        missingSkills:
          Array.isArray(ai.missingSkills) && ai.missingSkills.length >= 0
            ? ai.missingSkills.slice(0, 4)
            : item.missingSkills,
      };
    });
  } catch {
    return matches;
  }
};

export const buildJobMatches = async (
  resume: ResumeData,
  options?: { location?: string; remoteOnly?: boolean; limit?: number }
): Promise<JobMatch[]> => {
  const keywords = extractResumeKeywords(resume);
  const jobs = await fetchJobListings(keywords, options?.limit || 24);

  const locationFilter = (options?.location || "").toLowerCase();
  const prefiltered = jobs.filter((job) => {
    if (options?.remoteOnly && !job.remote) return false;
    if (!locationFilter) return true;
    return job.location.toLowerCase().includes(locationFilter);
  });

  const initial = prefiltered.map((job) => heuristicScore(keywords, job)).sort((a, b) => b.matchScore - a.matchScore);
  const refined = await maybeAiRefine(resume, initial);
  return refined.sort((a, b) => b.matchScore - a.matchScore).slice(0, options?.limit || 20);
};
