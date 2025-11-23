export type SectionId =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "contact"
  | "ats";

export interface ContactInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  highlights?: string[];
  technologies?: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  location: string;
  details?: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  impact?: string;
  technologies: string[];
  link?: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface SkillGroup {
  label: string;
  skills: string[];
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  keywords?: string[];
  jobDescription?: string;
}

export type TemplateVariant =
  | "aurora"
  | "noir"
  | "serif"
  | "grid"
  | "capsule"
  | "linear"
  | "focus"
  | "metro"
  | "elevate"
  | "minimal"
  | "legacy";

export interface ResumeTemplateMeta {
  id: TemplateVariant;
  name: string;
  tagline: string;
  accent: string;
  previewDescription: string;
  recommendedFor: string[];
}

export interface AtsScoreBreakdown {
  structure: number;
  keywords: number;
  impact: number;
  explanation: string[];
  keywordMatches: string[];
}

export interface AtsScoreResponse {
  score: number;
  breakdown: AtsScoreBreakdown;
}

export interface GeminiRequestBody {
  mode:
    | "improve"
    | "summary"
    | "bullet-points"
    | "full-resume"
    | "ats-feedback"
    | "missing-sections";
  tone?: "clarity" | "concise" | "impactful";
  context?: string;
  text?: string;
  resume?: ResumeData;
  jobDescription?: string;
}

export interface GeminiResponse<T = unknown> {
  data: T;
  usage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
}
