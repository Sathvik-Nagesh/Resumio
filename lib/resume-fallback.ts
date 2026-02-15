import { ResumeData } from "@/lib/types";

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_REGEX = /(https?:\/\/[^\s]+)/i;

const cleanLine = (value: string) => value.replace(/\s+/g, " ").trim();

const pickName = (lines: string[]) => {
  const first = cleanLine(lines[0] || "");
  if (!first) return "";
  if (EMAIL_REGEX.test(first) || first.length > 60) return "";
  return first;
};

const pickTitle = (lines: string[]) => {
  const candidates = lines.slice(0, 8).map(cleanLine);
  const common = ["engineer", "developer", "analyst", "manager", "designer", "scientist", "consultant", "specialist"];
  return candidates.find((line) => common.some((keyword) => line.toLowerCase().includes(keyword))) || "";
};

const extractSkills = (text: string) => {
  const seed = [
    "javascript",
    "typescript",
    "react",
    "node",
    "python",
    "java",
    "aws",
    "azure",
    "gcp",
    "kubernetes",
    "docker",
    "sql",
    "postgres",
    "security",
    "siem",
    "incident response",
    "terraform",
    "next.js",
  ];
  const lower = text.toLowerCase();
  return seed.filter((item) => lower.includes(item)).slice(0, 18);
};

export function buildFallbackResumeFromText(rawText: string): ResumeData {
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 400);

  const fullText = lines.join("\n");
  const emailMatch = fullText.match(EMAIL_REGEX)?.[0] || "";
  const phoneMatch = fullText.match(PHONE_REGEX)?.[0] || "";
  const firstUrl = fullText.match(URL_REGEX)?.[0] || "";
  const linkedinMatch = lines.find((line) => line.toLowerCase().includes("linkedin.com")) || "";
  const githubMatch = lines.find((line) => line.toLowerCase().includes("github.com")) || "";
  const summary = cleanLine(lines.slice(2, 12).join(" ")).slice(0, 650);
  const skills = extractSkills(fullText);

  return {
    contact: {
      name: pickName(lines),
      title: pickTitle(lines),
      email: emailMatch,
      phone: phoneMatch,
      location: "",
      website: firstUrl || undefined,
      linkedin: linkedinMatch || undefined,
      github: githubMatch || undefined,
    },
    summary,
    experience: [],
    education: [],
    skills: [
      {
        label: "Technical",
        skills,
      },
    ],
    projects: [],
    certifications: [],
  };
}
