import { CheckCircle, FileText, Gauge, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Sparkles,
    title: "Inline AI coaching",
    description:
      "Every text area ships with an ✨ Make it better button so Gemini can tighten clarity, impact, or conciseness.",
  },
  {
    icon: FileText,
    title: "15+ crafted templates",
    description:
      "Live preview galleries inspired by modern editorial and product resumes—each editable down to bullet order.",
  },
  {
    icon: Gauge,
    title: "ATS intelligence",
    description:
      "Structure, keyword, and impact subscores plus job description overlap checks keep you above 85/100.",
  },
  {
    icon: CheckCircle,
    title: "Exports for every portal",
    description: "One-click PDF, DOCX, and plain text export flows with toast feedback and resilient retry logic.",
  },
];

export function FeatureHighlights() {
  return (
    <div className="grid gap-6 md:grid-cols-2" id="features">
      {features.map((feature) => (
        <Card key={feature.title} className="h-full border-white/40 bg-white/80">
          <CardHeader className="gap-4">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/90 text-white shadow-lg">
              <feature.icon className="h-5 w-5" />
            </div>
            <CardTitle>{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  );
}
