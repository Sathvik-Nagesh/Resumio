import { TemplateVariant } from "@/lib/types";

export const PREMIUM_TEMPLATES = new Set<TemplateVariant>([
  "elevate",
  "metro",
  "capsule",
  "linear",
  "vector",
  "zenith",
  "pulse",
]);

export const isPremiumTemplate = (template: TemplateVariant) =>
  PREMIUM_TEMPLATES.has(template);

export const PRO_FEATURES = [
  "7 premium templates with executive and high-impact visual styles",
  "Native ATS-first PDF export (high quality text, not screenshots)",
  "DOCX export and advanced formatting presets",
  "Unlimited AI rewrites and regenerations",
  "Job Copilot cover letter generation and role-tailored resume drafting",
  "Cloud sync priority and faster AI queue",
];
