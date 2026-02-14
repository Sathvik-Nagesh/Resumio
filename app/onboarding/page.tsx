"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

const steps: OnboardingStep[] = [
  {
    id: "resume",
    title: "Build your first resume",
    description: "Open Studio and choose Upload, Templates, or AI mode to create a baseline profile.",
    href: "/studio?tab=upload",
    cta: "Open Studio",
  },
  {
    id: "match",
    title: "Generate job matches",
    description: "Run Job Copilot to get ranked roles and save the best ones to your tracker.",
    href: "/copilot",
    cta: "Open Job Copilot",
  },
  {
    id: "alerts",
    title: "Turn on job alerts",
    description: "Set frequency and email alerts so new matching roles come to you automatically.",
    href: "/copilot#alerts",
    cta: "Configure alerts",
  },
  {
    id: "prep",
    title: "Practice before interviews",
    description: "Use Interview Copilot to generate role-specific questions and improve answers.",
    href: "/interview",
    cta: "Open Interview Copilot",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      if (parsed && typeof parsed === "object") {
        setCompleted(parsed);
      }
    } catch {
      // No-op: start fresh when local state cannot be parsed.
    }
  }, []);

  const completedCount = useMemo(
    () => steps.filter((step) => completed[step.id]).length,
    [completed]
  );
  const allDone = completedCount === steps.length;

  const persist = (next: Record<string, boolean>) => {
    setCompleted(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const toggleStep = (id: string) => {
    const next = { ...completed, [id]: !completed[id] };
    persist(next);
  };

  const completeAll = () => {
    const next = Object.fromEntries(steps.map((step) => [step.id, true])) as Record<string, boolean>;
    persist(next);
    toast.success("Onboarding checklist completed.");
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Quickstart</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Get your job pipeline live</h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                Follow this onboarding flow once. It sets up resume quality, job matching, alerts, and interview prep.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/studio">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Studio
              </Link>
            </Button>
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
            <p className="text-sm font-medium text-emerald-900">
              Progress: {completedCount}/{steps.length} steps
            </p>
          </div>
        </header>

        <section className="space-y-4">
          {steps.map((step, index) => {
            const done = Boolean(completed[step.id]);
            return (
              <article key={step.id} className="rounded-3xl border border-slate-200/70 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      aria-label={done ? `Mark ${step.title} as not completed` : `Mark ${step.title} as completed`}
                      onClick={() => toggleStep(step.id)}
                      className="mt-0.5 text-slate-700"
                    >
                      {done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Step {index + 1}</p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">{step.title}</h2>
                      <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={step.href}>{step.cta}</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Finish onboarding</h3>
              <p className="mt-1 text-sm text-slate-600">
                Mark everything complete when your baseline flow is ready.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={completeAll}>
                <Sparkles className="mr-2 h-4 w-4" />
                Mark all complete
              </Button>
              <Button onClick={() => router.push(allDone ? "/copilot" : "/studio")}>
                {allDone ? "Go to Job Copilot" : "Continue setup"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
