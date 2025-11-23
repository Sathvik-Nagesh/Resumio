"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { useResumeStore } from "@/hooks/useResumeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GenerateForm {
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  yearsExp: string;
  skills: string;
  industry: string;
  goals: string;
}

export function AIModePanel() {
  const { setResume, setLoading, isLoading } = useResumeStore();
  const [form, setForm] = useState<GenerateForm>({
    name: "",
    email: "",
    phone: "",
    location: "",
    role: "Senior Full-Stack Engineer",
    yearsExp: "8",
    skills: "Next.js, Node.js, Gemini API, PostgreSQL",
    industry: "SaaS / AI tools",
    goals: "Highlight AI integrations and measurable impact",
  });

  const handleChange = (key: keyof GenerateForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async (action: "generate" | "regenerate") => {
    if (!form.role || !form.skills) {
      toast.error("Please fill out role and skills to guide Gemini");
      return;
    }
    let timeoutId: number | undefined;
    const controller = new AbortController();
    try {
      setLoading("ai", true);
      // Abort the request if it takes longer than 15 seconds
      timeoutId = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch("/api/ai/full-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.location,
          role: form.role,
          yearsExp: form.yearsExp,
          skills: form.skills,
          industry: form.industry,
          goals: form.goals,
          action,
        }),
        signal: controller.signal,
      });

      // Clear the timeout on success so it doesn't fire later
      if (timeoutId !== undefined) clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Gemini generation failed");
      const data = await response.json();
      if (!data.resume) {
        throw new Error("No resume returned");
      }
      setResume(data.resume);
      toast.success(action === "generate" ? "AI resume created" : "Section regenerated");
    } catch (error: any) {
      // Handle aborts (timeout) separately for a clearer user message
      const isAbort = error?.name === "AbortError" || (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError");
      if (isAbort) {
        toast.error("Request timed out. Please try again.");
      } else {
        console.error(error);
        toast.error("Unable to generate resume right now");
      }
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      setLoading("ai", false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/40 bg-white/85">
        <CardHeader className="gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle>Create with AI</CardTitle>
          <CardDescription>
            Describe the role, experience, and stack. Gemini drafts the entire resume with impact-focused language.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="rounded-3xl border border-white/40 bg-white/85 p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <Input value={form.name} placeholder="Sathvik Nagesh" onChange={(event) => handleChange("name", event.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={form.email} placeholder="hello@example.com" onChange={(event) => handleChange("email", event.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} placeholder="+1 (555) 000-0000" onChange={(event) => handleChange("phone", event.target.value)} />
          </Field>
          <Field label="Location">
            <Input value={form.location} placeholder="San Francisco, CA" onChange={(event) => handleChange("location", event.target.value)} />
          </Field>
        </div>

        <div className="h-px bg-slate-200/50 my-2" />

        <Field label="Role target">
          <Input value={form.role} onChange={(event) => handleChange("role", event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Years of experience">
            <Input value={form.yearsExp} onChange={(event) => handleChange("yearsExp", event.target.value)} />
          </Field>
          <Field label="Industry / domain">
            <Input value={form.industry} onChange={(event) => handleChange("industry", event.target.value)} />
          </Field>
        </div>
        <Field label="Key skills / tech stack">
          <AutosizeTextarea
            placeholder="Comma separated"
            value={form.skills}
            onChange={(event) => handleChange("skills", event.target.value)}
          />
        </Field>
        <Field label="Extra guidance (optional)">
          <AutosizeTextarea
            placeholder="Mention accomplishments to emphasize, keywords, tone, etc."
            value={form.goals}
            onChange={(event) => handleChange("goals", event.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleGenerate("generate")} disabled={isLoading.ai}>
            {isLoading.ai ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate resume
          </Button>
          <Button variant="outline" onClick={() => handleGenerate("regenerate")} disabled={isLoading.ai}>
            <Wand2 className="mr-2 h-4 w-4" /> Improve sections
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Gemini focuses on action verbs, metrics, and ATS keywords. You can still edit any section after generation.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
