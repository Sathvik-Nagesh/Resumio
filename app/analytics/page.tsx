"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { getAuthHeaders } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";

interface AnalyticsPayload {
  totals: {
    tracked: number;
    saved: number;
    applied: number;
    interview: number;
    rejected: number;
  };
  rates: {
    applyRate: number;
    interviewRate: number;
  };
  topCompanies: Array<{ company: string; count: number }>;
  suggestions: string[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/analytics/applications", {
          headers: {
            ...(await getAuthHeaders()),
          },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load analytics.");
        }
        setData(payload);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Application Analytics</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Track your conversion funnel</h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                See where applications are dropping and what to improve next.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/copilot">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Copilot
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {loading ? (
          <section className="rounded-3xl border border-slate-200/70 bg-white p-8 text-slate-500">Loading analytics...</section>
        ) : !data ? (
          <section className="rounded-3xl border border-slate-200/70 bg-white p-8 text-slate-500">No analytics data yet.</section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Tracked" value={data.totals.tracked} />
              <StatCard label="Saved" value={data.totals.saved} />
              <StatCard label="Applied" value={data.totals.applied} />
              <StatCard label="Interview" value={data.totals.interview} />
              <StatCard label="Rejected" value={data.totals.rejected} />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200/70 bg-white p-6">
                <h2 className="inline-flex items-center text-lg font-semibold text-slate-900">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Conversion rates
                </h2>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-600">Apply rate: <span className="font-semibold text-slate-900">{data.rates.applyRate}%</span></p>
                  <p className="text-sm text-slate-600">Interview rate: <span className="font-semibold text-slate-900">{data.rates.interviewRate}%</span></p>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200/70 bg-white p-6">
                <h2 className="inline-flex items-center text-lg font-semibold text-slate-900">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Top companies in pipeline
                </h2>
                <div className="mt-4 space-y-2">
                  {data.topCompanies.length === 0 ? (
                    <p className="text-sm text-slate-500">No tracked companies yet.</p>
                  ) : (
                    data.topCompanies.map((item) => (
                      <p key={item.company} className="text-sm text-slate-700">{item.company} - {item.count}</p>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">AI suggestions</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {data.suggestions.map((suggestion) => (
                  <li key={suggestion}>• {suggestion}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
