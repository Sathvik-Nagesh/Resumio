import { z } from "zod";

const normalizeText = (value: string, maxLen: number) =>
  value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);

const optionalSafeString = (maxLen: number) =>
  z
    .string()
    .optional()
    .transform((value) => (typeof value === "string" ? normalizeText(value, maxLen) : undefined));

export const aiImproveSchema = z.object({
  mode: z.enum(["summary", "bullet-points", "improve"]),
  tone: z.enum(["clarity", "concise", "impactful"]).optional(),
  text: z
    .string()
    .min(1, "Text is required")
    .transform((value) => normalizeText(value, 12000)),
  context: optionalSafeString(2000),
});

export const aiFullResumeSchema = z.object({
  name: optionalSafeString(120),
  email: optionalSafeString(160),
  phone: optionalSafeString(60),
  location: optionalSafeString(120),
  role: z
    .string()
    .min(1, "Role is required")
    .transform((value) => normalizeText(value, 120)),
  yearsExp: optionalSafeString(20),
  skills: z
    .string()
    .min(1, "Skills are required")
    .transform((value) => normalizeText(value, 1000)),
  industry: optionalSafeString(120),
  goals: optionalSafeString(1500),
  action: z.enum(["generate", "regenerate"]).optional(),
});

export const checkoutRequestSchema = z.object({
  currency: z.enum(["USD", "INR"]).optional(),
  interval: z.enum(["month", "year"]).optional(),
  couponCode: z
    .string()
    .max(40)
    .regex(/^[A-Za-z0-9_-]*$/)
    .optional()
    .transform((value) => value?.trim().toUpperCase()),
});

export const analyticsEventSchema = z.object({
  event: z.string().min(2).max(80).regex(/^[a-z0-9_:-]+$/i),
  source: z.string().min(2).max(60).optional(),
  variant: z.string().max(20).optional(),
  currency: z.enum(["USD", "INR"]).optional(),
  interval: z.enum(["month", "year"]).optional(),
  plan: z.enum(["free", "pro"]).optional(),
  couponApplied: z.boolean().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const safeString = (maxLen: number) =>
  z
    .string()
    .transform((value) => normalizeText(value, maxLen));

const optionalSafeStringLoose = (maxLen: number) =>
  z
    .string()
    .optional()
    .transform((value) => (typeof value === "string" ? normalizeText(value, maxLen) : undefined));

export const jobMatchRequestSchema = z.object({
  resume: z.object({
    contact: z.object({
      title: optionalSafeStringLoose(120),
    }).passthrough(),
    summary: safeString(2000),
    skills: z
      .array(
        z.object({
          label: safeString(80),
          skills: z.array(safeString(80)).max(40),
        })
      )
      .max(20),
    experience: z.array(z.object({
      role: optionalSafeStringLoose(120),
      bullets: z.array(safeString(240)).max(10).optional(),
      technologies: z.array(safeString(80)).max(20).optional(),
    }).passthrough()).max(25),
  }).passthrough(),
  location: optionalSafeStringLoose(120),
  remoteOnly: z.boolean().optional(),
  limit: z.number().int().min(5).max(40).optional(),
});

export const jobAlertPreferencesSchema = z.object({
  enabled: z.boolean(),
  email: z
    .string()
    .email()
    .max(160)
    .transform((value) => normalizeText(value.toLowerCase(), 160)),
  frequency: z.enum(["daily", "weekly"]),
  location: optionalSafeStringLoose(120),
  remoteOnly: z.boolean().optional(),
});

export const savedJobCreateSchema = z.object({
  job: z.object({
    id: safeString(120),
    title: safeString(180),
    company: safeString(160),
    location: safeString(120),
    remote: z.boolean(),
    applyUrl: z.string().url().max(400),
    source: safeString(80),
    publishedAt: safeString(80),
    description: safeString(4000),
    tags: z.array(safeString(60)).max(30),
    salary: optionalSafeStringLoose(80),
  }),
  matchScore: z.number().min(0).max(100),
  reasons: z.array(safeString(240)).max(5),
  missingSkills: z.array(safeString(80)).max(10),
});

export const savedJobStatusSchema = z.object({
  id: safeString(200),
  status: z.enum(["saved", "applied", "interview", "rejected"]),
});

export const jobTailorSchema = z.object({
  resume: z.object({}).passthrough(),
  job: z.object({
    title: safeString(180),
    company: safeString(160),
    description: safeString(5000),
  }),
});

export const coverLetterSchema = z.object({
  resume: z.object({}).passthrough(),
  job: z.object({
    title: safeString(180),
    company: safeString(160),
    description: safeString(5000),
  }),
});

export const interviewGenerateSchema = z.object({
  resume: z.object({}).passthrough(),
  role: z.string().min(2).max(180).transform((value) => normalizeText(value, 180)),
  company: z.string().min(1).max(160).transform((value) => normalizeText(value, 160)),
  jobDescription: z.string().min(20).max(6000).transform((value) => normalizeText(value, 6000)),
});

export const interviewScoreSchema = z.object({
  question: z.string().min(3).max(600).transform((value) => normalizeText(value, 600)),
  focus: z.string().min(1).max(120).transform((value) => normalizeText(value, 120)),
  idealAnswer: z.string().min(5).max(2500).transform((value) => normalizeText(value, 2500)),
  candidateAnswer: z.string().min(10).max(4000).transform((value) => normalizeText(value, 4000)),
});

export const interviewSessionUpsertSchema = z.object({
  id: z.string().min(2).max(200).transform((value) => normalizeText(value, 200)),
  role: z.string().min(2).max(180).transform((value) => normalizeText(value, 180)),
  company: z.string().min(1).max(160).transform((value) => normalizeText(value, 160)),
  jobDescription: z.string().min(20).max(6000).transform((value) => normalizeText(value, 6000)),
  questions: z.array(z.object({
    id: z.string().min(1).max(40),
    question: z.string().min(3).max(600),
    focus: z.string().min(1).max(120),
    idealAnswer: z.string().min(5).max(2500),
  })).max(20),
  answers: z.record(z.string(), z.string().max(4000)),
  scores: z.record(
    z.string(),
    z.object({
      score: z.number().min(0).max(100),
      feedback: z.string().max(2000),
      improvedAnswer: z.string().max(3000),
    })
  ),
});

export const autoApplyRuleSchema = z.object({
  enabled: z.boolean(),
  roles: z.array(z.string().max(120)).max(20),
  locations: z.array(z.string().max(120)).max(20),
  remoteOnly: z.boolean(),
  minMatchScore: z.number().int().min(0).max(100),
});

export const autoApplyQueueCreateSchema = z.object({
  job: z.object({
    id: safeString(120),
    title: safeString(180),
    company: safeString(160),
    location: safeString(120),
    remote: z.boolean(),
    applyUrl: z.string().url().max(400),
    source: safeString(80),
    publishedAt: safeString(80),
    description: safeString(4000),
    tags: z.array(safeString(60)).max(30),
    salary: optionalSafeStringLoose(80),
  }),
  matchScore: z.number().min(0).max(100),
});

export const autoApplyQueueStatusSchema = z.object({
  id: safeString(200),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const networkingMessageSchema = z.object({
  mode: z.enum(["recruiter", "referral", "followup"]),
  role: z.string().min(2).max(180).transform((value) => normalizeText(value, 180)),
  company: z.string().min(1).max(160).transform((value) => normalizeText(value, 160)),
  contactName: z.string().max(120).optional().transform((value) => (value ? normalizeText(value, 120) : undefined)),
  resume: z.object({}).passthrough(),
});
