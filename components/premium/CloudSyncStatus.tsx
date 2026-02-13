"use client";

import { AlertCircle, CheckCircle2, Cloud, Loader2 } from "lucide-react";

import { useAuthResume } from "@/components/providers/AuthResumeProvider";

export function CloudSyncStatus() {
  const { storageEnabled, user, saveStatus, lastSavedAt } = useAuthResume();

  if (!storageEnabled) {
    return <p className="text-xs text-slate-500">Cloud sync unavailable (Firebase not configured)</p>;
  }

  if (!user) {
    return <p className="text-xs text-slate-500">Sign in to enable cloud autosave</p>;
  }

  if (saveStatus === "saving") {
    return (
      <p className="inline-flex items-center gap-1 text-xs text-slate-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </p>
    );
  }

  if (saveStatus === "error") {
    return (
      <p className="inline-flex items-center gap-1 text-xs text-rose-600">
        <AlertCircle className="h-3.5 w-3.5" />
        Save failed
      </p>
    );
  }

  if (saveStatus === "saved" && lastSavedAt) {
    const time = new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return (
      <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Saved {time}
      </p>
    );
  }

  return (
    <p className="inline-flex items-center gap-1 text-xs text-slate-600">
      <Cloud className="h-3.5 w-3.5" />
      Cloud sync ready
    </p>
  );
}
