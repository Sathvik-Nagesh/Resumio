import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By using Resumio, you agree to these Terms and Conditions and any applicable laws. If you do not agree, do not use the service.",
  },
  {
    title: "2. Service Description",
    body: "Resumio provides tools to create, edit, and export resumes, including AI-assisted suggestions, ATS insights, and cloud-backed features for signed-in users.",
  },
  {
    title: "3. Account and Access",
    body: "You are responsible for maintaining the security of your account and for all activities performed through it. You must provide accurate information when requested.",
  },
  {
    title: "4. Acceptable Use",
    body: "You may not misuse the platform, attempt unauthorized access, interfere with service operations, or use the service for unlawful, abusive, or fraudulent activity.",
  },
  {
    title: "5. Intellectual Property",
    body: "Resumio and its original branding, code, and product assets are protected by applicable intellectual property laws. You retain ownership of resume content you create.",
  },
  {
    title: "6. Billing and Subscriptions",
    body: "Paid features are billed through Stripe. Subscription pricing, billing intervals, and plan features are shown at checkout. Cancellation and renewals are handled through Stripe billing tools.",
  },
  {
    title: "7. AI-Generated Content",
    body: "AI suggestions are provided for assistance and may be inaccurate or incomplete. You are responsible for reviewing and approving all final resume content before use.",
  },
  {
    title: "8. Limitation of Liability",
    body: "Resumio is provided on an as-is basis. To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from use of the service.",
  },
  {
    title: "9. Changes to Terms",
    body: "We may update these terms periodically. Continued use of Resumio after an update means you accept the revised terms.",
  },
  {
    title: "10. Contact",
    body: "For legal or policy questions, contact: support@resumio.app",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Legal</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Terms and Conditions</h1>
              <p className="mt-3 text-slate-600">Last updated: February 14, 2026</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button variant="subtle" asChild>
                <Link href="/policy">Privacy Policy</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-7">
          <div className="space-y-6">
            {TERMS_SECTIONS.map((section) => (
              <article key={section.title} className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="text-sm leading-6 text-slate-600">{section.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
