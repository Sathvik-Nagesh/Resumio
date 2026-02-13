"use client";

import { getAuthHeaders } from "@/lib/client-auth";

export async function trackEvent(payload: {
  event: string;
  source?: string;
  variant?: string;
  currency?: "USD" | "INR";
  interval?: "month" | "year";
  plan?: "free" | "pro";
  couponApplied?: boolean;
  metadata?: Record<string, string | number | boolean>;
}) {
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Analytics failures should never block UX actions.
  }
}
