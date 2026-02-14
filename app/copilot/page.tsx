"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Briefcase, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useResumeStore } from "@/hooks/useResumeStore";
import { useAuthResume } from "@/components/providers/AuthResumeProvider";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { getAuthHeaders } from "@/lib/client-auth";
import { trackEvent } from "@/lib/analytics";
import {
  AutoApplyQueueItem,
  AutoApplyQueueStatus,
  AutoApplyRule,
  AutomationActivityItem,
  JobAlertPreferences,
  JobApplicationStatus,
  JobMatch,
  ResumeData,
  SavedJobApplication,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const defaultPrefs: JobAlertPreferences = {
  enabled: false,
  email: "",
  frequency: "daily",
  location: "",
  remoteOnly: true,
};

const defaultAutoRule: AutoApplyRule = {
  enabled: false,
  roles: [],
  locations: [],
  remoteOnly: true,
  minMatchScore: 75,
  requireApproval: true,
  dryRun: true,
  dailyApprovalLimit: 15,
  allowedDomains: [],
};

const toSavedJobId = (source: string, id: string) => `${source}-${id}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);

interface TailoredVariant {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  resume: ResumeData;
  updatedAt: string;
}

export default function CopilotPage() {
  const resume = useResumeStore((state) => state.resume);
  const setResume = useResumeStore((state) => state.setResume);
  const { user, isPro } = useAuthResume();

  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<JobAlertPreferences>({ ...defaultPrefs, email: user?.email || "" });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedJobs, setSavedJobs] = useState<SavedJobApplication[]>([]);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(false);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [tailoringJobId, setTailoringJobId] = useState<string | null>(null);
  const [coverLetterJobId, setCoverLetterJobId] = useState<string | null>(null);
  const [coverLetters, setCoverLetters] = useState<Record<string, string>>({});
  const [tailoredResumes, setTailoredResumes] = useState<Record<string, ResumeData>>({});
  const [tailoredVariants, setTailoredVariants] = useState<TailoredVariant[]>([]);
  const [autoRule, setAutoRule] = useState<AutoApplyRule>(defaultAutoRule);
  const [savingAutoRule, setSavingAutoRule] = useState(false);
  const [autoQueue, setAutoQueue] = useState<AutoApplyQueueItem[]>([]);
  const [automationActivity, setAutomationActivity] = useState<AutomationActivityItem[]>([]);
  const [loadingAutoQueue, setLoadingAutoQueue] = useState(false);
  const [queueingJobId, setQueueingJobId] = useState<string | null>(null);
  const [networkMode, setNetworkMode] = useState<"recruiter" | "referral" | "followup">("recruiter");
  const [networkRole, setNetworkRole] = useState(resume.contact.title || "");
  const [networkCompany, setNetworkCompany] = useState("");
  const [networkContactName, setNetworkContactName] = useState("");
  const [networkMessage, setNetworkMessage] = useState("");
  const [generatingNetworkMessage, setGeneratingNetworkMessage] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTitle, setUpgradeTitle] = useState<string>("Explore Resumio Pro");
  const [upgradeDescription, setUpgradeDescription] = useState<string>(
    "Get advanced templates, exports, and AI workflows whenever you're ready."
  );
  const [upgradeHighlights, setUpgradeHighlights] = useState<string[]>([]);

  const profileLabel = useMemo(() => {
    const title = resume.contact.title?.trim();
    if (title) return title;
    return "your current resume";
  }, [resume.contact.title]);

  const savedJobIds = useMemo(() => new Set(savedJobs.map((item) => item.id)), [savedJobs]);
  const variantStorageKey = useMemo(() => `resumio:tailored-variants:${user?.uid || "guest"}`, [user?.uid]);

  const loadPrefs = useCallback(async () => {
    if (!user) {
      setPrefs((prev) => ({ ...prev, email: "" }));
      return;
    }

    try {
      const response = await fetch("/api/jobs/alerts", {
        headers: {
          ...(await getAuthHeaders()),
        },
      });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.preferences) {
        setPrefs(payload.preferences);
      }
    } catch {
      // No-op: keep defaults if alerts cannot be loaded.
    }
  }, [user]);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const loadSavedJobs = useCallback(async () => {
    if (!user) {
      setSavedJobs([]);
      return;
    }
    setLoadingSavedJobs(true);
    try {
      const response = await fetch("/api/jobs/saved", {
        headers: {
          ...(await getAuthHeaders()),
        },
      });
      if (!response.ok) return;
      const payload = await response.json();
      setSavedJobs(Array.isArray(payload.items) ? payload.items : []);
    } catch {
      // No-op for best-effort loading.
    } finally {
      setLoadingSavedJobs(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSavedJobs();
  }, [loadSavedJobs]);

  const loadAutomation = useCallback(async () => {
    if (!user) {
      setAutoRule(defaultAutoRule);
      setAutoQueue([]);
      setAutomationActivity([]);
      return;
    }
    setLoadingAutoQueue(true);
    try {
      const [ruleRes, queueRes] = await Promise.all([
        fetch("/api/automation/rules", {
          headers: { ...(await getAuthHeaders()) },
        }),
        fetch("/api/automation/queue", {
          headers: { ...(await getAuthHeaders()) },
        }),
      ]);

      if (ruleRes.ok) {
        const payload = await ruleRes.json();
        if (payload.rule) setAutoRule(payload.rule);
      }

      if (queueRes.ok) {
        const payload = await queueRes.json();
        setAutoQueue(Array.isArray(payload.items) ? payload.items : []);
        setAutomationActivity(Array.isArray(payload.activity) ? payload.activity : []);
      }
    } catch {
      // Best effort for optional automation framework.
    } finally {
      setLoadingAutoQueue(false);
    }
  }, [user]);

  useEffect(() => {
    void loadAutomation();
  }, [loadAutomation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(variantStorageKey);
      if (!raw) {
        setTailoredVariants([]);
        return;
      }
      const parsed = JSON.parse(raw) as TailoredVariant[];
      setTailoredVariants(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTailoredVariants([]);
    }
  }, [variantStorageKey]);

  const runMatching = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/jobs/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          resume,
          location,
          remoteOnly,
          limit: 20,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to fetch job matches.");
      }

      setMatches(Array.isArray(payload.matches) ? payload.matches : []);
      setGeneratedAt(payload.generatedAt || null);
      void trackEvent({
        event: "copilot_match_generated",
        source: "copilot_page",
        metadata: {
          results: Array.isArray(payload.matches) ? payload.matches.length : 0,
          remoteOnly,
          hasLocation: Boolean(location.trim()),
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate job matches.");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) {
      toast.info("Sign in to save email alerts.");
      return;
    }

    setSavingPrefs(true);
    try {
      const response = await fetch("/api/jobs/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(prefs),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save alert settings.");
      }
      toast.success("Job alert settings updated.");
      void trackEvent({
        event: "copilot_alert_saved",
        source: "copilot_page",
        metadata: {
          enabled: prefs.enabled,
          frequency: prefs.frequency,
          remoteOnly: prefs.remoteOnly === true,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save alert settings.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const saveJob = async (match: JobMatch) => {
    if (!user) {
      toast.info("Sign in to track job applications.");
      return;
    }
    const id = toSavedJobId(match.job.source, match.job.id);
    if (savedJobIds.has(id)) {
      toast.info("This job is already in your tracker.");
      return;
    }
    setSavingJobId(id);
    try {
      const response = await fetch("/api/jobs/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          job: match.job,
          matchScore: match.matchScore,
          reasons: match.reasons,
          missingSkills: match.missingSkills,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not save job.");
      }
      toast.success("Job added to tracker.");
      void trackEvent({
        event: "copilot_job_saved",
        source: "copilot_page",
        metadata: {
          score: match.matchScore,
          source: match.job.source,
        },
      });
      await loadSavedJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save job.");
    } finally {
      setSavingJobId(null);
    }
  };

  const updateSavedStatus = async (id: string, status: JobApplicationStatus) => {
    try {
      const response = await fetch("/api/jobs/saved", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ id, status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed updating status.");
      }
      setSavedJobs((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed updating status.");
    }
  };

  const tailorResumeForJob = async (match: JobMatch) => {
    if (!isPro) {
      promptProFeature(
        "Role-tailored resume drafts",
        "Create JD-specific resume versions, save variants, and prepare stronger applications with one click.",
        [
          "Role-focused summary and keyword alignment",
          "Stronger impact bullets tuned to the JD",
          "Instantly open the tailored draft in Studio",
        ]
      );
      return;
    }
    const id = toSavedJobId(match.job.source, match.job.id);
    setTailoringJobId(id);
    try {
      const response = await fetch("/api/jobs/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          resume,
          job: {
            title: match.job.title,
            company: match.job.company,
            description: match.job.description,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.resume) {
        throw new Error(payload.error || "Unable to tailor resume for this role.");
      }
      setResume(payload.resume);
      setTailoredResumes((prev) => ({ ...prev, [id]: payload.resume as ResumeData }));
      toast.success(`Tailored resume draft created for ${match.job.title}.`);
      void trackEvent({
        event: "copilot_tailor_resume",
        source: "copilot_page",
        metadata: {
          source: match.job.source,
          score: match.matchScore,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to tailor resume.");
    } finally {
      setTailoringJobId(null);
    }
  };

  const generateCoverLetter = async (match: JobMatch) => {
    if (!isPro) {
      promptProFeature(
        "Cover Letter Copilot",
        "Generate targeted cover letters for each role and company with reusable drafts and quick export.",
        [
          "Company-specific positioning in seconds",
          "Copy-ready and downloadable text draft",
          "Faster apply flow for every new role",
        ]
      );
      return;
    }
    const id = toSavedJobId(match.job.source, match.job.id);
    setCoverLetterJobId(id);
    try {
      const response = await fetch("/api/jobs/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          resume,
          job: {
            title: match.job.title,
            company: match.job.company,
            description: match.job.description,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.coverLetter !== "string") {
        throw new Error(payload.error || "Unable to generate cover letter.");
      }
      setCoverLetters((prev) => ({ ...prev, [id]: payload.coverLetter }));
      toast.success("Cover letter generated.");
      void trackEvent({
        event: "copilot_cover_letter_generated",
        source: "copilot_page",
        metadata: {
          source: match.job.source,
          score: match.matchScore,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate cover letter.");
    } finally {
      setCoverLetterJobId(null);
    }
  };

  const copyCoverLetter = async (id: string) => {
    const text = coverLetters[id];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Cover letter copied.");
    } catch {
      toast.error("Unable to copy cover letter.");
    }
  };

  const downloadCoverLetter = (id: string, jobTitle: string, company: string) => {
    const text = coverLetters[id];
    if (!text) return;
    const slug = `${jobTitle}-${company}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cover-letter-${slug || "resumio"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const persistTailoredVariants = (next: TailoredVariant[]) => {
    setTailoredVariants(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(variantStorageKey, JSON.stringify(next));
    }
  };

  const saveTailoredVariant = (match: JobMatch) => {
    if (!isPro) {
      promptProFeature(
        "Named resume variants",
        "Save multiple tailored resume versions for different roles and load them instantly in Studio.",
        [
          "Keep separate versions by role/company",
          "Switch variants without losing your base resume",
          "Reuse your best-performing drafts quickly",
        ]
      );
      return;
    }
    const id = toSavedJobId(match.job.source, match.job.id);
    const tailored = tailoredResumes[id];
    if (!tailored) {
      toast.info("Generate a tailored draft first.");
      return;
    }
    const name = window.prompt("Name this tailored resume version:", `${match.job.title} @ ${match.job.company}`);
    if (!name || !name.trim()) return;

    const variantId = `${id}:${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const now = new Date().toISOString();
    const existing = tailoredVariants.filter((item) => item.id !== variantId);
    const next: TailoredVariant[] = [
      {
        id: variantId,
        name: name.trim(),
        jobTitle: match.job.title,
        company: match.job.company,
        resume: tailored,
        updatedAt: now,
      },
      ...existing,
    ].slice(0, 25);
    persistTailoredVariants(next);
    toast.success("Tailored variant saved.");
  };

  const loadTailoredVariant = (variant: TailoredVariant) => {
    setResume(variant.resume);
    toast.success(`Loaded variant: ${variant.name}`);
  };

  const removeTailoredVariant = (id: string) => {
    persistTailoredVariants(tailoredVariants.filter((item) => item.id !== id));
  };

  const promptProFeature = (feature: string, detail: string, highlights?: string[]) => {
    setUpgradeTitle(`${feature} is part of Pro`);
    setUpgradeDescription(detail);
    setUpgradeHighlights(highlights || []);
    setShowUpgradeModal(true);
    toast.info(`${feature} is available in Pro whenever you're ready.`, {
      action: {
        label: "View Pro options",
        onClick: () => setShowUpgradeModal(true),
      },
    });
  };

  const saveAutomationRule = async () => {
    if (!isPro) {
      promptProFeature(
        "Approval queue automation",
        "Set matching rules and review queued roles with guardrails before any automated apply workflow.",
        [
          "Queue only roles above your score threshold",
          "Approve or reject before any next automation step",
          "Keep control with review-first guardrails",
        ]
      );
      return;
    }
    if (!user) {
      toast.info("Sign in to save automation rules.");
      return;
    }
    setSavingAutoRule(true);
    try {
      const response = await fetch("/api/automation/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(autoRule),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not save automation rule.");
      toast.success("Automation rule saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save automation rule.");
    } finally {
      setSavingAutoRule(false);
    }
  };

  const queueJobForApproval = async (match: JobMatch) => {
    if (!isPro) {
      promptProFeature(
        "Approval queue automation",
        "Queue strong matches for review and manage approved/rejected outcomes in one flow.",
        [
          "Collect strongest matches in one queue",
          "Mark approved or rejected in one click",
          "Prepare for safe automation without blind apply",
        ]
      );
      return;
    }
    if (!user) {
      toast.info("Sign in to use approval queue.");
      return;
    }
    const id = toSavedJobId(match.job.source, match.job.id);
    setQueueingJobId(id);
    try {
      const response = await fetch("/api/automation/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          job: match.job,
          matchScore: match.matchScore,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not queue job.");
      toast.success("Added to approval queue.");
      await loadAutomation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not queue job.");
    } finally {
      setQueueingJobId(null);
    }
  };

  const updateQueueStatus = async (id: string, status: AutoApplyQueueStatus) => {
    try {
      const response = await fetch("/api/automation/queue", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ id, status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update queue item.");
      setAutoQueue((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status, updatedAt: new Date().toISOString() }
            : item
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update queue item.");
    }
  };

  const generateNetworkingMessage = async () => {
    if (!isPro) {
      promptProFeature(
        "Outreach Copilot",
        "Generate recruiter outreach, referral requests, and follow-up messages tailored to your profile.",
        [
          "Role-specific message drafts in under a minute",
          "Referral and follow-up variants from one input",
          "Clear CTA wording ready to send",
        ]
      );
      return;
    }
    if (!networkRole.trim() || !networkCompany.trim()) {
      toast.info("Role and company are required for outreach generation.");
      return;
    }
    setGeneratingNetworkMessage(true);
    try {
      const response = await fetch("/api/networking/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          mode: networkMode,
          role: networkRole,
          company: networkCompany,
          contactName: networkContactName,
          resume,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.message !== "string") {
        throw new Error(payload.error || "Could not generate outreach message.");
      }
      setNetworkMessage(payload.message);
      toast.success("Outreach message generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate outreach message.");
    } finally {
      setGeneratingNetworkMessage(false);
    }
  };

  const copyNetworkingMessage = async () => {
    if (!networkMessage) return;
    try {
      await navigator.clipboard.writeText(networkMessage);
      toast.success("Outreach message copied.");
    } catch {
      toast.error("Unable to copy message.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Job Copilot</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">AI job matching for {profileLabel}</h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                Generate ranked job opportunities from your resume and enable email alerts so you can apply faster.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/studio">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Studio
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/interview">Interview Copilot</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/analytics">Analytics</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <article id="alerts" className="rounded-3xl border border-slate-200/70 bg-white p-7">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <h2 className="text-2xl font-semibold text-slate-900">Find matching jobs</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Preferred location
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="United States / New York / Remote"
                  className="mt-1"
                />
              </label>
              <label className="flex items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(event) => setRemoteOnly(event.target.checked)}
                  className="h-4 w-4"
                />
                Remote jobs only
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <Button onClick={runMatching} disabled={loading}>
                {loading ? "Matching jobs..." : "Generate job matches"}
              </Button>
              <Button variant="subtle" asChild>
                <Link href="/pricing">Explore Pro options</Link>
              </Button>
            </div>
            {generatedAt ? (
              <p className="mt-3 text-xs text-slate-500">Last generated: {new Date(generatedAt).toLocaleString()}</p>
            ) : null}
          </article>

          <article className="rounded-3xl border border-slate-200/70 bg-white p-7">
            <div className="mb-5 flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-700" />
              <h2 className="text-2xl font-semibold text-slate-900">Email alerts</h2>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Alert email
                <Input
                  type="email"
                  value={prefs.email}
                  onChange={(event) => setPrefs((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="you@example.com"
                  className="mt-1"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Frequency
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={prefs.frequency}
                  onChange={(event) => setPrefs((prev) => ({ ...prev, frequency: event.target.value as "daily" | "weekly" }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <label className="flex items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={prefs.enabled}
                  onChange={(event) => setPrefs((prev) => ({ ...prev, enabled: event.target.checked }))}
                  className="h-4 w-4"
                />
                Enable job alert emails
              </label>
            </div>
            <Button className="mt-5 w-full" onClick={savePreferences} disabled={savingPrefs}>
              {savingPrefs ? "Saving..." : "Save alert settings"}
            </Button>
            {!user ? <p className="mt-3 text-xs text-slate-500">Sign in to persist alert preferences.</p> : null}
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Top job matches</h3>
            <p className="text-sm text-slate-500">{matches.length} results</p>
          </div>

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Run Job Copilot to see role matches ranked by AI and skill overlap.
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <article key={match.job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{match.job.title}</p>
                      <p className="text-sm text-slate-600">{match.job.company}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      Match {match.matchScore}%
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <p className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {match.job.location}
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {match.job.source}
                    </p>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {match.reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>

                  {match.missingSkills.length > 0 ? (
                    <p className="mt-3 text-xs text-amber-700">Missing skills: {match.missingSkills.join(", ")}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button asChild>
                      <a href={match.job.applyUrl} target="_blank" rel="noopener noreferrer">
                        Open application
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void tailorResumeForJob(match)}
                      disabled={tailoringJobId === toSavedJobId(match.job.source, match.job.id)}
                    >
                      {tailoringJobId === toSavedJobId(match.job.source, match.job.id)
                        ? "Tailoring..."
                        : "Tailor resume (Pro)"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => saveTailoredVariant(match)}
                      disabled={!tailoredResumes[toSavedJobId(match.job.source, match.job.id)]}
                    >
                      Save tailored variant (Pro)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void queueJobForApproval(match)}
                      disabled={queueingJobId === toSavedJobId(match.job.source, match.job.id)}
                    >
                      {queueingJobId === toSavedJobId(match.job.source, match.job.id)
                        ? "Queueing..."
                        : "Queue for approval (Pro)"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void generateCoverLetter(match)}
                      disabled={coverLetterJobId === toSavedJobId(match.job.source, match.job.id)}
                    >
                      {coverLetterJobId === toSavedJobId(match.job.source, match.job.id)
                        ? "Generating letter..."
                        : "Generate cover letter (Pro)"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => saveJob(match)}
                      disabled={savingJobId === toSavedJobId(match.job.source, match.job.id) || savedJobIds.has(toSavedJobId(match.job.source, match.job.id))}
                    >
                      {savedJobIds.has(toSavedJobId(match.job.source, match.job.id))
                        ? "Saved to tracker"
                        : savingJobId === toSavedJobId(match.job.source, match.job.id)
                          ? "Saving..."
                          : "Save job"}
                    </Button>
                    <Button variant="subtle" asChild>
                      <Link href="/studio">Open tailored resume in Studio</Link>
                    </Button>
                  </div>
                  {coverLetters[toSavedJobId(match.job.source, match.job.id)] ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Cover letter draft</p>
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">
                        {coverLetters[toSavedJobId(match.job.source, match.job.id)]}
                      </pre>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void copyCoverLetter(toSavedJobId(match.job.source, match.job.id))}
                        >
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadCoverLetter(
                              toSavedJobId(match.job.source, match.job.id),
                              match.job.title,
                              match.job.company
                            )
                          }
                        >
                          Download .txt
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Application tracker</h3>
            <p className="text-sm text-slate-500">{loadingSavedJobs ? "Loading..." : `${savedJobs.length} tracked`}</p>
          </div>
          {savedJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Save jobs from your matches to track progress from saved to interview.
            </div>
          ) : (
            <div className="space-y-3">
              {savedJobs.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.job.title}</p>
                      <p className="text-sm text-slate-600">{item.job.company}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        Match {item.matchScore}%
                      </span>
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                        value={item.status}
                        onChange={(event) => void updateSavedStatus(item.id, event.target.value as JobApplicationStatus)}
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <p className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {item.job.location}
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {item.job.source}
                    </p>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" asChild>
                      <a href={item.job.applyUrl} target="_blank" rel="noopener noreferrer">
                        Open application
                      </a>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Saved tailored variants</h3>
            <p className="text-sm text-slate-500">{tailoredVariants.length} saved</p>
          </div>
          {tailoredVariants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Tailor a resume for a job, then save it as a named variant.
            </div>
          ) : (
            <div className="space-y-3">
              {tailoredVariants.map((variant) => (
                <article key={variant.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{variant.name}</p>
                      <p className="text-sm text-slate-600">
                        {variant.jobTitle} at {variant.company}
                      </p>
                      <p className="text-xs text-slate-500">Updated: {new Date(variant.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/studio" onClick={() => loadTailoredVariant(variant)}>
                          Load in Studio
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeTailoredVariant(variant.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200/70 bg-white p-6">
            <h3 className="text-xl font-semibold text-slate-900">Automation rule (guardrail mode)</h3>
            <p className="mt-2 text-sm text-slate-600">
              Jobs are never applied automatically in this mode. Matching roles are added to an approval queue.
            </p>
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={autoRule.enabled}
                  onChange={(event) => setAutoRule((prev) => ({ ...prev, enabled: event.target.checked }))}
                  className="h-4 w-4"
                />
                Enable approval queue automation
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Target roles (comma-separated)
                <Input
                  className="mt-1"
                  value={autoRule.roles.join(", ")}
                  onChange={(event) =>
                    setAutoRule((prev) => ({
                      ...prev,
                      roles: event.target.value.split(",").map((value) => value.trim()).filter(Boolean),
                    }))
                  }
                  placeholder="Cybersecurity Engineer, SOC Analyst"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Target locations (comma-separated)
                <Input
                  className="mt-1"
                  value={autoRule.locations.join(", ")}
                  onChange={(event) =>
                    setAutoRule((prev) => ({
                      ...prev,
                      locations: event.target.value.split(",").map((value) => value.trim()).filter(Boolean),
                    }))
                  }
                  placeholder="Remote, United States"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Minimum match score
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  max={100}
                  value={autoRule.minMatchScore}
                  onChange={(event) =>
                    setAutoRule((prev) => ({
                      ...prev,
                      minMatchScore: Math.max(0, Math.min(100, Number(event.target.value || 0))),
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Daily approval limit
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  max={100}
                  value={autoRule.dailyApprovalLimit}
                  onChange={(event) =>
                    setAutoRule((prev) => ({
                      ...prev,
                      dailyApprovalLimit: Math.max(1, Math.min(100, Number(event.target.value || 1))),
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Allowed apply domains (comma-separated)
                <Input
                  className="mt-1"
                  value={autoRule.allowedDomains.join(", ")}
                  onChange={(event) =>
                    setAutoRule((prev) => ({
                      ...prev,
                      allowedDomains: event.target.value
                        .split(",")
                        .map((value) => value.trim().toLowerCase())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="linkedin.com, greenhouse.io, lever.co"
                />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={autoRule.requireApproval}
                  onChange={(event) => setAutoRule((prev) => ({ ...prev, requireApproval: event.target.checked }))}
                  className="h-4 w-4"
                />
                Human approval required for every action
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={autoRule.dryRun}
                  onChange={(event) => setAutoRule((prev) => ({ ...prev, dryRun: event.target.checked }))}
                  className="h-4 w-4"
                />
                Dry-run mode (no external auto-apply attempts)
              </label>
              <p className="text-xs text-slate-500">
                Guardrails are enforced server-side: allowlisted domains, daily approval limits, and activity logging.
              </p>
              <Button onClick={() => void saveAutomationRule()} disabled={savingAutoRule}>
                {savingAutoRule ? "Saving..." : "Save automation rule"}
              </Button>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/70 bg-white p-6">
            <h3 className="text-xl font-semibold text-slate-900">Approval queue</h3>
            <p className="mt-2 text-sm text-slate-600">
              Review queued jobs and mark approved or rejected before any future automated apply step.
            </p>
            <div className="mt-4 space-y-3">
              {loadingAutoQueue ? (
                <p className="text-sm text-slate-500">Loading queue...</p>
              ) : autoQueue.length === 0 ? (
                <p className="text-sm text-slate-500">No queued jobs yet.</p>
              ) : (
                autoQueue.map((item) => (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.job.title}</p>
                        <p className="text-xs text-slate-600">{item.job.company}</p>
                      </div>
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => void updateQueueStatus(item.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void updateQueueStatus(item.id, "rejected")}>
                        Reject
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Activity className="h-5 w-5 text-slate-700" />
              Automation activity
            </h3>
            <p className="text-sm text-slate-500">{automationActivity.length} events</p>
          </div>
          {automationActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity events yet.</p>
          ) : (
            <div className="space-y-3">
              {automationActivity.map((event) => (
                <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{event.action.replace("_", " ")}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                        event.status === "allowed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{event.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-900">Outreach Copilot</h3>
          <p className="mt-2 text-sm text-slate-600">
            Generate recruiter outreach, referral requests, and follow-up messages tailored to your profile.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Message type
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={networkMode}
                onChange={(event) => setNetworkMode(event.target.value as "recruiter" | "referral" | "followup")}
              >
                <option value="recruiter">Recruiter outreach</option>
                <option value="referral">Referral request</option>
                <option value="followup">Follow-up</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Role
              <Input className="mt-1" value={networkRole} onChange={(event) => setNetworkRole(event.target.value)} />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Company
              <Input className="mt-1" value={networkCompany} onChange={(event) => setNetworkCompany(event.target.value)} />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Contact name (optional)
              <Input className="mt-1" value={networkContactName} onChange={(event) => setNetworkContactName(event.target.value)} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => void generateNetworkingMessage()} disabled={generatingNetworkMessage}>
              {generatingNetworkMessage ? "Generating..." : "Generate message (Pro)"}
            </Button>
            <Button variant="outline" onClick={() => void copyNetworkingMessage()} disabled={!networkMessage}>
              Copy message
            </Button>
          </div>
          {networkMessage ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{networkMessage}</pre>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <p className="inline-flex items-start gap-2 text-sm text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
            Phase 1 is recommendations + alerts only. Auto-apply is intentionally disabled until explicit rules and review controls are added.
          </p>
        </section>
      </div>
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={upgradeTitle}
        description={upgradeDescription}
        highlights={upgradeHighlights}
        primaryLabel="See Pro options"
        continueLabel="Keep exploring free"
      />
    </main>
  );
}
