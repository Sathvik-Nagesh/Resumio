import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

const POLICY_SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly, such as account profile details and resume content you create or upload. We also collect limited technical data needed to operate and secure the service.",
  },
  {
    title: "2. How We Use Information",
    body: "Your information is used to deliver core product functionality, improve resume generation quality, support billing, and maintain service reliability and security.",
  },
  {
    title: "3. AI and Resume Data",
    body: "When you use AI features, relevant resume inputs may be processed to generate suggestions. You are responsible for reviewing generated outputs before final use.",
  },
  {
    title: "4. Payments",
    body: "Payments are processed by Stripe. Resumio does not store complete card numbers or sensitive payment credentials on its own servers.",
  },
  {
    title: "5. Data Retention",
    body: "We retain data for as long as needed to provide services, meet legal obligations, and resolve disputes. You may request account-related data deletion where applicable.",
  },
  {
    title: "6. Data Sharing",
    body: "We do not sell your personal data. We may share data with trusted service providers only to the extent required to run the platform, such as hosting, analytics, and payments.",
  },
  {
    title: "7. Security",
    body: "We use reasonable technical and organizational safeguards to protect your information. No system is perfectly secure, and you should use strong account security practices.",
  },
  {
    title: "8. Your Choices",
    body: "You may update profile information, manage subscriptions, and choose how you use optional product features. You can stop using the service at any time.",
  },
  {
    title: "9. Policy Updates",
    body: "We may revise this policy from time to time. Updated versions will be posted on this page with the latest revision date.",
  },
  {
    title: "10. Contact",
    body: "For privacy requests or questions, contact: privacy@resumio.app",
  },
];

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Legal</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Privacy Policy</h1>
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
                <Link href="/terms">Terms & Conditions</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-7">
          <div className="space-y-6">
            {POLICY_SECTIONS.map((section) => (
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
