"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden rounded-[40px] border border-white/30 bg-white/70 px-8 py-16 shadow-[0_40px_120px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:px-16 lg:px-24">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-inner">
          <Sparkles className="h-4 w-4" />
          AI-powered resumes
        </div>
        <h1 className="text-balance text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl lg:text-7xl xl:text-8xl">
          <span className="text-slate-900">Resumio helps you build </span>
          <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">glassmorphism resumes</span>
          <span className="text-slate-900"> that pass ATS and impress humans.</span>
        </h1>
        <p className="mt-8 text-xl text-slate-600 sm:text-2xl lg:text-2xl">
          Upload an existing resume, start from one of 15+ templates, or let Gemini craft a first draft from a job
          description. Inline ✨ upgrades, ATS scoring, and PDF/DOCX exports included.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/studio">
              Launch studio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="subtle" size="lg">
            <Link href="#modes">Explore templates</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/interview">Try Interview Copilot</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Default workspace shows Sathvik Nagesh&apos;s profile so you can see the polish instantly.
        </p>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-16 top-10 hidden h-72 rounded-[40px] border border-white/10 bg-gradient-to-r from-slate-100/10 via-white/5 to-slate-100/10 blur-3xl md:block" />
      <div className="pointer-events-none absolute -right-10 top-10 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-200/30 to-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-gradient-to-br from-purple-200/30 to-pink-200/30 blur-3xl" />
    </section>
  );
}
