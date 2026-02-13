import { TemplateVariant } from "@/lib/types";

export const PREMIUM_TEMPLATES = new Set<TemplateVariant>([
  "elevate",
  "metro",
  "capsule",
  "linear",
]);

export const isPremiumTemplate = (template: TemplateVariant) =>
  PREMIUM_TEMPLATES.has(template);

export const PRO_FEATURES = [
  "Premium templates with executive visual styles",
  "Native ATS-first PDF export (high quality text, not screenshots)",
  "DOCX export and advanced formatting presets",
  "Unlimited AI rewrites and regenerations",
  "Cloud sync priority and faster AI queue",
];
