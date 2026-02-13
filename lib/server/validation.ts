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
