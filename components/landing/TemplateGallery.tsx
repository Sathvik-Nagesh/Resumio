import Link from "next/link";

import { resumeTemplates } from "@/data/templates";

// Explicit map of known template IDs to Tailwind gradient classes.
// Avoid interpolating arbitrary strings into `className` to keep Tailwind JIT safe.
const ACCENT_CLASSES: Record<string, string> = {
  aurora: "from-[#111827] to-[#0f172a]",
  noir: "from-[#0f172a] to-[#1f2937]",
  serif: "from-[#312e81] to-[#6d28d9]",
  grid: "from-[#0ea5e9] to-[#0369a1]",
  capsule: "from-[#14b8a6] to-[#0d9488]",
  linear: "from-[#f97316] to-[#ea580c]",
  focus: "from-[#38bdf8] to-[#0284c7]",
  metro: "from-[#ef4444] to-[#dc2626]",
  elevate: "from-[#a855f7] to-[#7c3aed]",
  minimal: "from-[#4b5563] to-[#1f2937]",
  legacy: "from-[#0d9488] to-[#115e59]",
};

export function TemplateGallery() {
  return (
    <section id="templates" className="mt-16 space-y-8">
      <div className="flex flex-col gap-3 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Template gallery</p>
        <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          10+ editorial-grade resume canvases
        </h2>
        <p className="text-base text-slate-600 sm:text-lg">
          Pick a template to auto-fill with your data. Switch anytime—content stays synced.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(resumeTemplates) && resumeTemplates.length > 0 ? (
          resumeTemplates.map((template) => (
            <div
              key={template.id}
              className="group relative rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_30px_70px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{template.id}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{template.name}</h3>
                </div>
                <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white">
                  {template.tagline}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-600">{template.previewDescription}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                {template.recommendedFor.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-sm font-medium text-slate-900">
                <Link href="/studio" className="inline-flex items-center gap-2">
                  Use template
                  <span aria-hidden className="text-lg transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <div
                  className={`h-20 w-32 rounded-2xl border border-slate-200/80 bg-gradient-to-r ${
                    ACCENT_CLASSES[template.id] ?? "from-slate-700 to-slate-900"
                  } p-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-white opacity-90 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100`}
                >
                  {template.name}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-600">No templates available right now. Please try again later.</p>
          </div>
        )}
      </div>
    </section>
  );
}
