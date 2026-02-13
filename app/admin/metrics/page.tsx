"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/client-auth";

interface MetricsResponse {
  windowDays: number;
  since: string;
  totals: {
    pricingViews: number;
    checkoutStarts: number;
    checkoutSuccess: number;
    checkoutCancel: number;
    paywallHits: number;
    exportSuccess: number;
  };
  funnel: {
    pricingViews: number;
    checkoutStarts: number;
    checkoutSuccess: number;
    visitToStartRate: number;
    visitToPaidRate: number;
    startToPaidRate: number;
  };
  variants: Record<
    string,
    {
      pricingViews: number;
      checkoutStarts: number;
      checkoutSuccess: number;
      conversionRate: number;
    }
  >;
  daily: Array<{
    date: string;
    pricingViews: number;
    checkoutStarts: number;
    checkoutSuccess: number;
    paywallHits: number;
  }>;
  webhook: {
    total: number;
    failures: number;
    avgDurationMs: number;
  };
  sampleSize: {
    analyticsEvents: number;
    webhookLogs: number;
  };
}

const pct = (value: number) => `${value.toFixed(2)}%`;

export default function AdminMetricsPage() {
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricsResponse | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/metrics?days=${days}`, {
        headers: {
          ...(await getAuthHeaders()),
        },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to load metrics");
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMetrics();
  }, [days]);

  const variantRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.variants).map(([variant, stat]) => ({ variant, ...stat }));
  }, [data]);

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-8 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Admin</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Metrics Dashboard</h1>
              <p className="mt-2 text-sm text-slate-600">
                Conversion funnel, variant performance, and webhook reliability.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Window
                <select
                  aria-label="Select date range window"
                  className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
              </label>
              <Button variant="outline" onClick={() => void fetchMetrics()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="subtle" asChild>
                <Link href="/pricing">Pricing page</Link>
              </Button>
            </div>
          </div>
        </header>

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}. Ensure you are signed in with an email listed in `ADMIN_EMAILS`.
          </section>
        ) : null}

        {!data || loading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading metrics…
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Pricing views" value={String(data.funnel.pricingViews)} />
              <MetricCard label="Checkout starts" value={String(data.funnel.checkoutStarts)} />
              <MetricCard label="Paid conversions" value={String(data.funnel.checkoutSuccess)} />
              <MetricCard label="Visit -> Start" value={pct(data.funnel.visitToStartRate)} />
              <MetricCard label="Visit -> Paid" value={pct(data.funnel.visitToPaidRate)} />
              <MetricCard label="Start -> Paid" value={pct(data.funnel.startToPaidRate)} />
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Webhook logs" value={String(data.webhook.total)} />
              <MetricCard label="Webhook failures" value={String(data.webhook.failures)} />
              <MetricCard label="Webhook avg duration" value={`${data.webhook.avgDurationMs}ms`} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">A/B Variant Performance</h2>
              <p className="mt-1 text-xs text-slate-500">Variant from `/pricing?variant=a|b`</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Pricing variant conversion metrics</caption>
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4">Variant</th>
                      <th className="py-2 pr-4">Views</th>
                      <th className="py-2 pr-4">Starts</th>
                      <th className="py-2 pr-4">Paid</th>
                      <th className="py-2 pr-4">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantRows.map((row) => (
                      <tr key={row.variant} className="border-b border-slate-100 text-slate-700">
                        <td className="py-2 pr-4 font-semibold uppercase">{row.variant}</td>
                        <td className="py-2 pr-4">{row.pricingViews}</td>
                        <td className="py-2 pr-4">{row.checkoutStarts}</td>
                        <td className="py-2 pr-4">{row.checkoutSuccess}</td>
                        <td className="py-2 pr-4">{pct(row.conversionRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">Daily Trend</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Daily pricing and conversion trend</caption>
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Views</th>
                      <th className="py-2 pr-4">Starts</th>
                      <th className="py-2 pr-4">Paid</th>
                      <th className="py-2 pr-4">Paywall hits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((row) => (
                      <tr key={row.date} className="border-b border-slate-100 text-slate-700">
                        <td className="py-2 pr-4">{row.date}</td>
                        <td className="py-2 pr-4">{row.pricingViews}</td>
                        <td className="py-2 pr-4">{row.checkoutStarts}</td>
                        <td className="py-2 pr-4">{row.checkoutSuccess}</td>
                        <td className="py-2 pr-4">{row.paywallHits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
