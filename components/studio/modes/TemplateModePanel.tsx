"use client";

import { ReactNode, useState } from "react";
import { LayoutTemplate, Plus, Sparkles, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

import { resumeTemplates } from "@/data/templates";
import { useResumeStore } from "@/hooks/useResumeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TemplateVariant } from "@/lib/types";
import { useAuthResume } from "@/components/providers/AuthResumeProvider";
import { isPremiumTemplate } from "@/lib/premium";
import { getAuthHeaders } from "@/lib/client-auth";
import { UpgradeModal } from "@/components/premium/UpgradeModal";

const steps = [
  { id: "basic", title: "Basics", description: "Contact + title" },
  { id: "summary", title: "Summary", description: "Professional hook" },
  { id: "experience", title: "Experience", description: "Roles & impact" },
  { id: "education", title: "Education", description: "Schools & achievements" },
  { id: "skills", title: "Skills & Projects", description: "Show expertise" },
];

export function TemplateModePanel() {
  const { isPro } = useAuthResume();
  const {
    resume,
    template,
    setTemplate,
    updateContact,
    updateSummary,
    addExperience,
    updateExperience,
    updateExperienceBullet,
    addExperienceBullet,
    removeExperienceBullet,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    addProject,
    updateProject,
    removeProject,
    setLoading,
    isLoading,
  } = useResumeStore();
  const [step, setStep] = useState(0);
  const [showTemplateUpgrade, setShowTemplateUpgrade] = useState(false);
  const isPremiumPreviewLocked = !isPro && isPremiumTemplate(template);

  const handleSummaryAI = async (tone: "clarity" | "concise" | "impactful") => {
    if (!resume.summary || resume.summary.trim().length < 10) {
      toast.error("Please add a summary first for the AI to improve.");
      return;
    }

    try {
      setLoading("ai", true);
      const response = await fetch("/api/ai/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          mode: "summary",
          tone,
          text: resume.summary,
          context: resume.contact.title,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const data = await response.json();

      // The `/api/ai/improve` endpoint returns a JSON object with an `improvedText` string.
      // This is a custom backend contract (we do not directly consume the raw Gemini API here),
      // so rely on that field and fail clearly if it's missing.
      const newText = typeof data?.improvedText === "string" ? data.improvedText.trim() : undefined;

      if (!newText) {
        console.error("/api/ai/improve returned an unexpected response shape:", data);
        toast.error("AI returned an unexpected result. Please try again.");
      } else if (newText !== resume.summary) {
        updateSummary(newText);
        toast.success(`Summary updated for ${tone}!`);
      } else {
        toast.info("AI thought the summary was already good!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gemini could not update the summary yet");
    } finally {
      setLoading("ai", false);
    }
  };

  const handleSkillChange = (index: number, value: string) => {
    const next = resume.skills.map((group, idx) =>
      idx === index
        ? {
          ...group,
          skills: value
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        }
        : group
    );
    updateSkills(next);
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/40 bg-white/85">
        <CardHeader className="gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <LayoutTemplate className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle>Choose template</CardTitle>
            <CardDescription>Select a glassmorphism layout. Content stays synced when you switch.</CardDescription>
            {isPremiumPreviewLocked ? (
              <span className="inline-flex w-fit rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-900">
                Preview only
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumeTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                templateId={tpl.id}
                name={tpl.name}
                tagline={tpl.tagline}
                isPremium={isPremiumTemplate(tpl.id)}
                isPro={isPro}
                selected={template === tpl.id}
                onSelect={() => {
                  setTemplate(tpl.id);
                  if (isPremiumTemplate(tpl.id) && !isPro) {
                    toast.info("Preview mode enabled for this Pro template. Editing stays locked on free plan.");
                  }
                }}
              />
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="relative rounded-3xl border border-white/40 bg-white/85 p-6">
        {isPremiumPreviewLocked ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-semibold text-amber-900">Pro template preview</p>
            <p className="mt-1 text-sm text-amber-800">
              You can view this template style now. Editing controls are paused on free plan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setShowTemplateUpgrade(true)}>
                Unlock this template
              </Button>
              <Button size="sm" variant="outline" onClick={() => setTemplate("aurora")}>
                Switch to free template
              </Button>
            </div>
          </div>
        ) : null}
        <div className={cn(isPremiumPreviewLocked ? "pointer-events-none opacity-60 select-none" : "")}>
        <div className="flex flex-wrap gap-2">
          {steps.map((item, index) => (
            <Button
              key={item.id}
              variant={step === index ? "default" : "subtle"}
              onClick={() => setStep(index)}
              size="sm"
            >
              {item.title}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">{steps[step].description}</p>

        {steps[step].id === "basic" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                placeholder="Sathvik Nagesh"
                value={resume.contact.name}
                onChange={(event) => updateContact({ name: event.target.value })}
              />
            </Field>
            <Field label="Role title">
              <Input
                placeholder="Senior Full-Stack Engineer"
                value={resume.contact.title}
                onChange={(event) => updateContact({ title: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input value={resume.contact.email} onChange={(event) => updateContact({ email: event.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={resume.contact.phone} onChange={(event) => updateContact({ phone: event.target.value })} />
            </Field>
            <Field label="Location">
              <Input
                value={resume.contact.location}
                onChange={(event) => updateContact({ location: event.target.value })}
              />
            </Field>
            <Field label="LinkedIn">
              <Input
                value={resume.contact.linkedin ?? ""}
                onChange={(event) => updateContact({ linkedin: event.target.value })}
              />
            </Field>
            <Field label="Website">
              <Input
                value={resume.contact.website ?? ""}
                onChange={(event) => updateContact({ website: event.target.value })}
              />
            </Field>
            <Field label="GitHub">
              <Input
                value={resume.contact.github ?? ""}
                onChange={(event) => updateContact({ github: event.target.value })}
              />
            </Field>
          </div>
        ) : null}

        {steps[step].id === "summary" ? (
          <div className="mt-6 space-y-4">
            <AutosizeTextarea
              placeholder="Write a concise professional summary..."
              value={resume.summary}
              onChange={(event) => updateSummary(event.target.value)}
            />
            <p className="text-xs text-slate-500">
              Better results: include role scope, years of experience, and one quantified win before clicking AI improve.
            </p>
            <div className="flex flex-wrap gap-3">
              {(["clarity", "concise", "impactful"] as const).map((tone) => (
                <Button
                  key={tone}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSummaryAI(tone)}
                  disabled={isLoading.ai}
                >
                  {isLoading.ai ? (
                    <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Improving...</span>
                  ) : (
                    <span className="flex items-center"><Sparkles className="mr-2 h-4 w-4" /> Make it more {tone}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {steps[step].id === "experience" ? (
          <div className="mt-6 space-y-6">
            {resume.experience.map((exp, expIndex) => (
              <div key={exp.id} className="rounded-2xl border border-slate-200/80 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Role">
                    <Input value={exp.role} onChange={(event) => updateExperience(exp.id, { role: event.target.value })} />
                  </Field>
                  <Field label="Company">
                    <Input
                      value={exp.company}
                      onChange={(event) => updateExperience(exp.id, { company: event.target.value })}
                    />
                  </Field>
                  <Field label="Location">
                    <Input
                      value={exp.location}
                      onChange={(event) => updateExperience(exp.id, { location: event.target.value })}
                    />
                  </Field>
                  <div className="flex gap-3">
                    <Field label="Start">
                      <Input
                        value={exp.startDate}
                        onChange={(event) => updateExperience(exp.id, { startDate: event.target.value })}
                      />
                    </Field>
                    <Field label="End">
                      <Input
                        value={exp.endDate}
                        onChange={(event) => updateExperience(exp.id, { endDate: event.target.value })}
                      />
                    </Field>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <AutosizeTextarea
                      key={`${exp.id}-bullet-${bulletIndex}`}
                      value={bullet}
                      placeholder="Achievement with measurable impact"
                      onChange={(event) =>
                        updateExperienceBullet(exp.id, bulletIndex, event.target.value)
                      }
                    />
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => addExperienceBullet(exp.id)}>
                      Add bullet
                    </Button>
                    {exp.bullets.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperienceBullet(exp.id, exp.bullets.length - 1)}
                      >
                        Remove bullet
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => removeExperience(exp.id)}>
                      Remove experience
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addExperience}>
              <Plus className="mr-2 h-4 w-4" /> Add experience
            </Button>
          </div>
        ) : null}

        {steps[step].id === "education" ? (
          <div className="mt-6 space-y-6">
            {resume.education.map((edu) => (
              <div key={edu.id} className="rounded-2xl border border-slate-200/80 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="School">
                    <Input
                      value={edu.school}
                      onChange={(event) => updateEducation(edu.id, { school: event.target.value })}
                    />
                  </Field>
                  <Field label="Degree">
                    <Input
                      value={edu.degree}
                      onChange={(event) => updateEducation(edu.id, { degree: event.target.value })}
                    />
                  </Field>
                  <Field label="Location">
                    <Input
                      value={edu.location}
                      onChange={(event) => updateEducation(edu.id, { location: event.target.value })}
                    />
                  </Field>
                  <div className="flex gap-3">
                    <Field label="Start">
                      <Input
                        value={edu.startDate}
                        onChange={(event) => updateEducation(edu.id, { startDate: event.target.value })}
                      />
                    </Field>
                    <Field label="End">
                      <Input
                        value={edu.endDate}
                        onChange={(event) => updateEducation(edu.id, { endDate: event.target.value })}
                      />
                    </Field>
                  </div>
                </div>
                <AutosizeTextarea
                  className="mt-3"
                  placeholder="Highlights separated by commas"
                  value={edu.details?.join(", ") ?? ""}
                  onChange={(event) =>
                    updateEducation(edu.id, {
                      details: event.target.value
                        .split(",")
                        .map((detail) => detail.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => removeEducation(edu.id)}>
                  Remove education
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addEducation}>
              <Plus className="mr-2 h-4 w-4" /> Add education
            </Button>
          </div>
        ) : null}

        {steps[step].id === "skills" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {resume.skills.map((group, index) => (
                <div key={group.label}>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{group.label}</p>
                  <AutosizeTextarea
                    placeholder="Comma separated"
                    value={group.skills.join(", ")}
                    onChange={(event) => handleSkillChange(index, event.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {resume.projects.map((project) => (
                <div key={project.id} className="rounded-2xl border border-slate-200/80 p-4">
                  <Field label="Project name">
                    <Input
                      value={project.name}
                      onChange={(event) => updateProject(project.id, { name: event.target.value })}
                    />
                  </Field>
                  <AutosizeTextarea
                    className="mt-3"
                    placeholder="Impactful description"
                    value={project.description}
                    onChange={(event) => updateProject(project.id, { description: event.target.value })}
                  />
                  <Field label="Technologies">
                    <Input
                      className="mt-0"
                      value={project.technologies.join(", ")}
                      onChange={(event) =>
                        updateProject(project.id, {
                          technologies: event.target.value
                            .split(",")
                            .map((tech) => tech.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </Field>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => removeProject(project.id)}>
                      Remove project
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addProject}>
                <Plus className="mr-2 h-4 w-4" /> Add project
              </Button>
            </div>
          </div>
        ) : null}
        </div>
      </div>
      <UpgradeModal
        open={showTemplateUpgrade}
        onClose={() => setShowTemplateUpgrade(false)}
        title="This template is available in Pro"
        description="You can preview this layout now. Pro unlocks full editing so you can personalize every section."
        highlights={[
          "Edit all sections directly inside this template",
          "Keep your current content while switching styles",
          "Access all premium template families for different role types",
        ]}
        primaryLabel="See Pro options"
        continueLabel="Keep previewing free"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function TemplateCard({ templateId, name, tagline, isPremium, isPro, selected, onSelect }: TemplateCardProps) {
  // Template-specific color schemes
  const templateColors: Record<TemplateVariant, { bg: string; accent: string }> = {
    aurora: { bg: "bg-gradient-to-br from-slate-900 to-slate-700", accent: "border-slate-300" },
    noir: { bg: "bg-slate-900", accent: "border-slate-700" },
    serif: { bg: "bg-slate-100", accent: "border-slate-300" },
    grid: { bg: "bg-slate-200", accent: "border-slate-400" },
    capsule: { bg: "bg-gradient-to-br from-emerald-100 to-teal-100", accent: "border-emerald-300" },
    linear: { bg: "bg-gradient-to-br from-orange-100 to-amber-100", accent: "border-orange-300" },
    focus: { bg: "bg-white", accent: "border-slate-200" },
    metro: { bg: "bg-slate-950", accent: "border-red-500" },
    elevate: { bg: "bg-gradient-to-r from-purple-900 to-purple-700", accent: "border-purple-300" },
    minimal: { bg: "bg-white", accent: "border-slate-900" },
    legacy: { bg: "bg-white", accent: "border-teal-500" },
    vector: { bg: "bg-gradient-to-br from-teal-800 to-emerald-700", accent: "border-teal-300" },
    zenith: { bg: "bg-gradient-to-r from-indigo-900 to-blue-700", accent: "border-indigo-300" },
    slate: { bg: "bg-slate-100", accent: "border-slate-400" },
    pulse: { bg: "bg-gradient-to-r from-rose-700 to-pink-700", accent: "border-rose-300" },
  };

  const colors = templateColors[templateId];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full rounded-2xl border px-4 py-4 text-left transition hover:-translate-y-1 hover:shadow-lg",
        selected ? "border-slate-900 bg-white shadow-lg ring-2 ring-slate-900 ring-offset-2" : "border-slate-200 bg-white/70",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-slate-900">{name}</span>
        <div className="flex items-center gap-2">
          {isPremium && !isPro ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              <Crown className="mr-1 h-3 w-3" />
              Pro
            </span>
          ) : null}
          {selected && <span className="text-xs font-bold text-slate-900">✓</span>}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-600">{tagline}</p>

      {/* Mini Template Preview */}
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className={cn("h-6 px-2 py-1", colors.bg)}>
          <div className="h-full w-16 rounded bg-white/20"></div>
        </div>
        <div className="space-y-1 p-2">
          <div className="h-1.5 w-full rounded bg-slate-200"></div>
          <div className="h-1.5 w-3/4 rounded bg-slate-200"></div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <div className={cn("h-8 rounded border", colors.accent)}></div>
            <div className={cn("h-8 rounded border", colors.accent)}></div>
          </div>
        </div>
      </div>
    </button>
  );
}

interface TemplateCardProps {
  templateId: TemplateVariant;
  name: string;
  tagline: string;
  isPremium: boolean;
  isPro: boolean;
  selected: boolean;
  onSelect: () => void;
}
