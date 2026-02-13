"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuthResume } from "@/components/providers/AuthResumeProvider";
import { trackEvent } from "@/lib/analytics";
import {
  BillingInterval,
  Currency,
  detectPreferredCurrency,
  formatPrice,
  getProSavingsPercent,
  PRO_PRICE_POINTS,
} from "@/lib/pricing";

const FREE_FEATURES = [
  "Resume upload parsing and editor",
  "Core templates and basic ATS score",
  "TXT and native PDF export",
  "Daily AI credits for summary improvements",
];

const PRO_FEATURES = [
  "Premium templates and advanced design packs",
  "Unlimited AI rewrites + section regenerations",
  "DOCX export and advanced formatting options",
  "Priority AI processing and upcoming premium tools",
];

export default function PricingPage() {
  const { user, isPro, upgradeToPro, openBillingPortal, refreshSubscription } = useAuthResume();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [couponCode, setCouponCode] = useState("");
  const [pending, setPending] = useState(false);
  const [variant, setVariant] = useState<"a" | "b">("a");
  const [checkoutState, setCheckoutState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams(window.location.search);
    setVariant(query.get("variant") === "b" ? "b" : "a");
    setCheckoutState(query.get("checkout"));
  }, []);

  useEffect(() => {
    setCurrency(detectPreferredCurrency(typeof navigator !== "undefined" ? navigator.language : "en-US"));
  }, []);

  useEffect(() => {
    if (checkoutState === "success") {
      void trackEvent({ event: "checkout_success", source: "pricing_page", variant });
      void refreshSubscription().then(() => {
        toast.success("Payment successful. Subscription is being activated.");
      });
    } else if (checkoutState === "cancel") {
      void trackEvent({ event: "checkout_cancel", source: "pricing_page", variant });
      toast.info("Checkout canceled. You can continue using free plan.");
    }
  }, [checkoutState, refreshSubscription, variant]);

  useEffect(() => {
    void trackEvent({
      event: "pricing_view",
      source: "pricing_page",
      variant,
      currency,
      interval,
      plan: isPro ? "pro" : "free",
    });
  }, [currency, interval, isPro, variant]);

  const pricePoints = useMemo(() => PRO_PRICE_POINTS[currency], [currency]);
  const proPrice = interval === "month" ? pricePoints.monthly : pricePoints.yearly;
  const savings = getProSavingsPercent(currency);

  const startCheckout = async () => {
    try {
      setPending(true);
      void trackEvent({
        event: "checkout_start",
        source: "pricing_page",
        variant,
        currency,
        interval,
        plan: isPro ? "pro" : "free",
        couponApplied: Boolean(couponCode.trim()),
      });
      await upgradeToPro(currency, interval, couponCode || undefined);
    } catch (error) {
      console.error(error);
      toast.error("Unable to start checkout. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Pricing</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Simple plans for serious job seekers</h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Free plan keeps the core experience accessible. Pro is designed for power users who need scale, speed, and polish.
              </p>
              {variant === "b" ? (
                <p className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Limited launch pricing available now
                </p>
              ) : null}
            </div>
            <Button variant="outline" asChild>
              <Link href="/studio">Back to Studio</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <article className="rounded-3xl border border-slate-200/70 bg-white p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">Free</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
                Always available
              </span>
            </div>
            <p className="text-4xl font-semibold text-slate-900">{formatPrice(0, currency)}</p>
            <p className="mt-1 text-sm text-slate-500">No credit card required</p>
            <ul className="mt-6 space-y-3">
              {FREE_FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-7 w-full" variant="subtle" asChild>
              <Link href="/studio">Continue with free</Link>
            </Button>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-amber-300/60 bg-gradient-to-br from-white to-amber-50 p-7 shadow-[0_24px_60px_rgba(180,83,9,0.16)]">
            <div className="absolute right-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Recommended
            </div>
            <div className="mb-5 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              <h2 className="text-2xl font-semibold text-slate-900">Resumio Pro</h2>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Currency
                <select
                  aria-label="Choose billing currency"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as Currency)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Billing
                <select
                  aria-label="Choose billing interval"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={interval}
                  onChange={(event) => setInterval(event.target.value as BillingInterval)}
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </label>
            </div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Coupon code (optional)
              <input
                aria-label="Coupon code"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                placeholder="WELCOME10"
              />
            </label>

            <p className="text-4xl font-semibold text-slate-900">{formatPrice(proPrice, currency)}</p>
            <p className="mt-1 text-sm text-slate-600">
              per {interval} {interval === "year" ? `· save ${savings}%` : ""}
            </p>

            <ul className="mt-6 space-y-3">
              {PRO_FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <Sparkles className="mt-0.5 h-4 w-4 text-amber-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                className="flex-1"
                onClick={startCheckout}
                disabled={!user || pending || isPro}
                aria-label="Upgrade to Resumio Pro"
              >
                {isPro ? "Pro active" : pending ? "Starting checkout..." : "Upgrade securely"}
              </Button>
              {isPro ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await openBillingPortal();
                    } catch (error) {
                      console.error(error);
                      toast.error("Could not open billing portal");
                    }
                  }}
                >
                  Manage billing
                </Button>
              ) : null}
            </div>
            {!user ? (
              <p className="mt-3 text-xs text-slate-500">Sign in with Google in Studio to start checkout.</p>
            ) : null}
          </article>
        </section>

        {variant === "b" ? (
          <section className="sticky bottom-4 rounded-2xl border border-amber-200/80 bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-700">
                Unlock Pro for {formatPrice(proPrice, currency)} per {interval}. Keep free essentials forever.
              </p>
              <Button onClick={startCheckout} disabled={!user || pending || isPro}>
                {isPro ? "Pro active" : "Get Pro"}
              </Button>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">Security and trust</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <p className="inline-flex items-start gap-2 text-sm text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Billing is handled by Stripe Checkout and customer portal, not stored in client code.
            </p>
            <p className="inline-flex items-start gap-2 text-sm text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Pro access is validated server-side for AI endpoints to prevent client-side bypass.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
