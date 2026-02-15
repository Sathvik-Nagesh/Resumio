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
  | "legacy"
  | "vector"
  | "zenith"
  | "slate"
  | "pulse";

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
  quality?: number;
  parseConfidence?: number;
  roleProfile?: string;
  aiAdjustment?: number;
  explanation: string[];
  keywordMatches: string[];
  missingKeywords?: string[];
  sectionPenalties?: string[];
  weights?: {
    structure: number;
    keywords: number;
    impact: number;
    quality: number;
  };
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

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  applyUrl: string;
  source: string;
  publishedAt: string;
  description: string;
  tags: string[];
  salary?: string;
}

export interface JobMatch {
  job: JobListing;
  matchScore: number;
  reasons: string[];
  missingSkills: string[];
}

export interface JobAlertPreferences {
  enabled: boolean;
  email: string;
  frequency: "daily" | "weekly";
  location?: string;
  remoteOnly?: boolean;
}

export type JobApplicationStatus = "saved" | "applied" | "interview" | "rejected";

export interface SavedJobApplication {
  id: string;
  uid: string;
  status: JobApplicationStatus;
  matchScore: number;
  reasons: string[];
  missingSkills: string[];
  job: JobListing;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  focus: string;
  idealAnswer: string;
}

export interface InterviewAnswerScore {
  score: number;
  feedback: string;
  improvedAnswer: string;
}

export interface InterviewSession {
  id: string;
  uid: string;
  role: string;
  company: string;
  jobDescription: string;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  scores: Record<string, InterviewAnswerScore>;
  createdAt: string;
  updatedAt: string;
}

export interface AutoApplyRule {
  enabled: boolean;
  roles: string[];
  locations: string[];
  remoteOnly: boolean;
  minMatchScore: number;
  requireApproval: boolean;
  dryRun: boolean;
  dailyApprovalLimit: number;
  allowedDomains: string[];
}

export type AutoApplyQueueStatus = "pending" | "approved" | "rejected";

export interface AutoApplyQueueItem {
  id: string;
  uid: string;
  status: AutoApplyQueueStatus;
  job: JobListing;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
}

export type AutomationActivityStatus = "allowed" | "blocked";

export interface AutomationActivityItem {
  id: string;
  action: "queue_add" | "status_change";
  status: AutomationActivityStatus;
  reason: string;
  queueId?: string;
  targetStatus?: AutoApplyQueueStatus;
  host?: string | null;
  dryRun?: boolean;
  createdAt: string;
}
