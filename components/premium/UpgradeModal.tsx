"use client";

import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthResume } from "@/components/providers/AuthResumeProvider";
import { PRO_FEATURES } from "@/lib/premium";
import { BillingInterval, Currency, detectPreferredCurrency, formatPrice, getProSavingsPercent, PRO_PRICE_POINTS } from "@/lib/pricing";
import { trackEvent } from "@/lib/analytics";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { isPro, upgradeToPro, openBillingPortal } = useAuthResume();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCurrency(detectPreferredCurrency(navigator.language));
  }, []);

  if (!open) return null;

  const handleUpgrade = async () => {
    try {
      void trackEvent({
        event: "checkout_start",
        source: "upgrade_modal",
        currency,
        interval,
        plan: isPro ? "pro" : "free",
        couponApplied: Boolean(couponCode.trim()),
      });
      await upgradeToPro(currency, interval, couponCode || undefined);
    } catch (error) {
      console.error(error);
      toast.error("Upgrade failed. Please try again.");
    }
  };

  const prices = PRO_PRICE_POINTS[currency];
  const priceValue = interval === "month" ? prices.monthly : prices.yearly;
  const savings = getProSavingsPercent(currency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <Card className="w-full max-w-xl border-amber-200/60 bg-white">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg">
              <Crown className="h-5 w-5" />
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close upgrade modal">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-2xl" id="upgrade-title">Upgrade to Resumio Pro</CardTitle>
          <CardDescription>
            Unlock premium templates, advanced exports, and pro-grade AI tools.
          </CardDescription>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Currency
              <select
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Pro price</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{formatPrice(priceValue, currency)}</p>
            <p className="text-sm text-slate-600">
              per {interval === "month" ? "month" : "year"}
              {interval === "year" ? ` · save ${savings}%` : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <ul className="space-y-2 text-sm text-slate-700">
              {PRO_FEATURES.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button onClick={handleUpgrade} disabled={isPro}>
              <Crown className="mr-2 h-4 w-4" />
              {isPro ? "Pro active" : "Continue to secure checkout"}
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
                Manage subscription
              </Button>
            ) : null}
            <Button variant="outline" onClick={onClose}>
              Continue free
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
