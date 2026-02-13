"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  LayoutTemplate,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { Hero } from "@/components/landing/Hero";
import { FeatureHighlights } from "@/components/landing/FeatureHighlights";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const modes = [
  {
    title: "Upload resume",
    icon: UploadCloud,
    description:
      "Drop in PDF or DOCX files. We parse sections, bullets, and metrics, then score ATS readiness instantly.",
  },
  {
    title: "Start from template",
    icon: LayoutTemplate,
    description:
      "Choose from 10+ glassmorphism canvases and fill a guided wizard. AI suggestions help craft each section.",
  },
  {
    title: "Create with AI",
    icon: Sparkles,
    description:
      "Describe the role, years of experience, and stack. Gemini drafts an entire resume ready for edits in seconds.",
  },
];

const stats = [
  { label: "Templates", value: "10+", detail: "switch anytime" },
  { label: "ATS score", value: "85+", detail: "avg. after coaching" },
  { label: "Exports", value: "PDF / DOCX / TXT", detail: "robust + fast" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f7f7f4] pb-24">
      <main className="container mx-auto max-w-[1600px] px-8 pt-0 pb-20 sm:px-12 lg:px-16 xl:px-20">
        <div className="flex justify-end pt-6">
          <GoogleAuthButton />
        </div>
        <Hero />

        <section className="mt-16 space-y-10" id="modes">
          <SectionHeading
            eyebrow="Creation modes"
            title="Three ways to build a perfect resume"
            description="Whether you already have a PDF, prefer guided templates, or want AI to do the heavy lifting, Resumio adapts to your flow."
            align="left"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {modes.map((mode) => (
              <Card key={mode.title} className="bg-white/85">
                <CardHeader className="gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                    <mode.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{mode.title}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="ghost" asChild>
                    <Link href="/studio" className="inline-flex items-center gap-2 text-sm">
                      Try this mode
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-20 space-y-8">
          <SectionHeading
            eyebrow="Why Resumio"
            title="AI-native workflows, ATS-aware insights"
            description="We combine structured parsing, Gemini prompting, and editorial design systems so you can focus on your story."
            align="left"
          />
          <FeatureHighlights />
        </section>

        <section className="mt-20 grid gap-8 rounded-[32px] border border-white/40 bg-white/80 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.15)] md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">ATS & AI insights</p>
            <h3 className="text-3xl font-semibold text-slate-900">
              Built-in ATS scoring with Gemini coaching keeps your resume aligned to any job description.
            </h3>
            <p className="text-base text-slate-600">
              Paste a JD so Resumio can surface keyword gaps, action-verb opportunities, and impact metrics. Every
              section has ✨ Make it better controls with clarity, concise, and impactful presets.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/studio">Open Studio</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/studio#ats">See ATS analyzer</Link>
              </Button>
              <Button asChild variant="subtle">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-slate-500">Create a profile to prefill contact details and personalize exports; you can update your display name in Settings.</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-white/50 bg-white/70 p-6">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[32px] border border-white/40 bg-white/80 p-10 text-center shadow-[0_30px_90px_rgba(15,23,42,0.14)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Ready to build your career?
            </h3>
            <p className="text-base text-slate-600 sm:text-lg">
              Resumio's studio keeps your content, templates, ATS scores, and Gemini suggestions in sync across every
              mode.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/studio">
                  Launch Resumio Studio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="subtle" size="lg">
                <Link href="#modes">See creation modes</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 border-t border-slate-200 pt-8">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Built by Sathvik Nagesh</p>
              <div className="flex gap-6">
                <a href="https://linkedin.com/in/sathvik-nagesh" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
                  LinkedIn
                </a>
                <a href="https://instagram.com/sathvik_nagesh" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
                  Instagram
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
