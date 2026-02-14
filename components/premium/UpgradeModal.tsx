"use client";

import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
  title?: string;
  description?: string;
  highlights?: string[];
  primaryLabel?: string;
  continueLabel?: string;
}

export function UpgradeModal({
  open,
  onClose,
  title,
  description,
  highlights,
  primaryLabel,
  continueLabel,
}: UpgradeModalProps) {
  const { isPro, upgradeToPro, openBillingPortal } = useAuthResume();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCurrency(detectPreferredCurrency(navigator.language));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl"
          >
            <Card className="border-amber-200/60 bg-white">
              <CardHeader className="gap-4">
          <div className="flex items-start justify-between">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg">
              <Crown className="h-5 w-5" />
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close upgrade modal">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-2xl" id="upgrade-title">{title || "Explore Resumio Pro"}</CardTitle>
          <CardDescription>
            {description || "Get advanced templates, exports, and AI workflows whenever you're ready."}
          </CardDescription>
          {highlights && highlights.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">What you get in 1 minute</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {highlights.slice(0, 4).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
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
            <p className="mt-3 text-xs text-slate-500">
              Keep using free features as long as you like. Pro is here when you want deeper workflow support.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button onClick={handleUpgrade} disabled={isPro}>
              <Crown className="mr-2 h-4 w-4" />
              {isPro ? "Pro active" : primaryLabel || "See Pro options"}
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
              {continueLabel || "Keep exploring free"}
            </Button>
          </div>
              </CardHeader>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
