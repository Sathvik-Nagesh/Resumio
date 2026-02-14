"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useResumeStore } from "@/hooks/useResumeStore";
import { useAuthResume } from "@/components/providers/AuthResumeProvider";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { getAuthHeaders } from "@/lib/client-auth";
import { trackEvent } from "@/lib/analytics";
import type { InterviewAnswerScore, InterviewQuestion, InterviewSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";

const toSessionId = (role: string, company: string) =>
  `session-${role}-${company}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 120);

export default function InterviewPage() {
  const resume = useResumeStore((state) => state.resume);
  const { user, isPro } = useAuthResume();

  const [role, setRole] = useState(resume.contact.title || "");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, InterviewAnswerScore>>({});

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const completion = useMemo(() => {
    if (questions.length === 0) return 0;
    const answered = questions.filter((question) => (answers[question.id] || "").trim().length > 0).length;
    return Math.round((answered / questions.length) * 100);
  }, [answers, questions]);

  const loadSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      return;
    }
    try {
      const response = await fetch("/api/interview/sessions", {
        headers: {
          ...(await getAuthHeaders()),
        },
      });
      if (!response.ok) return;
      const payload = await response.json();
      setSessions(Array.isArray(payload.items) ? payload.items : []);
    } catch {
      // Best effort load only.
    }
  }, [user]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const generateQuestions = async () => {
    if (!role.trim() || !company.trim() || !jobDescription.trim()) {
      toast.error("Role, company, and job description are required.");
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          resume,
          role,
          company,
          jobDescription,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not generate interview set.");
      }

      const generated = Array.isArray(payload.questions) ? payload.questions : [];
      setQuestions(generated);
      setAnswers({});
      setScores({});
      setCurrentSessionId(toSessionId(role, company));

      void trackEvent({
        event: "interview_generated",
        source: "interview_page",
        metadata: { questionCount: generated.length },
      });
      toast.success("Interview set generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate interview questions.");
    } finally {
      setGenerating(false);
    }
  };

  const scoreAnswer = async (question: InterviewQuestion) => {
    if (!isPro) {
      setShowUpgradeModal(true);
      toast.info("Answer scoring is available in Pro whenever you're ready.", {
        action: {
          label: "View Pro options",
          onClick: () => setShowUpgradeModal(true),
        },
      });
      return;
    }
    const candidateAnswer = (answers[question.id] || "").trim();
    if (candidateAnswer.length < 20) {
      toast.info("Write a fuller answer before scoring.");
      return;
    }

    setScoringId(question.id);
    try {
      const response = await fetch("/api/interview/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          question: question.question,
          focus: question.focus,
          idealAnswer: question.idealAnswer,
          candidateAnswer,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not score answer.");
      }

      setScores((prev) => ({
        ...prev,
        [question.id]: {
          score: payload.score || 0,
          feedback: payload.feedback || "",
          improvedAnswer: payload.improvedAnswer || "",
        },
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not score answer.");
    } finally {
      setScoringId(null);
    }
  };

  const saveSession = async () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      toast.info("Saved interview sessions are available in Pro whenever you're ready.", {
        action: {
          label: "View Pro options",
          onClick: () => setShowUpgradeModal(true),
        },
      });
      return;
    }
    if (!user) {
      toast.info("Sign in to save interview sessions.");
      return;
    }
    if (!currentSessionId || questions.length === 0) {
      toast.info("Generate an interview set first.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/interview/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          id: currentSessionId,
          role,
          company,
          jobDescription,
          questions,
          answers,
          scores,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not save session.");
      }
      toast.success("Interview session saved.");
      await loadSessions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save session.");
    } finally {
      setSaving(false);
    }
  };

  const loadSession = (session: InterviewSession) => {
    setCurrentSessionId(session.id);
    setRole(session.role);
    setCompany(session.company);
    setJobDescription(session.jobDescription);
    setQuestions(session.questions || []);
    setAnswers(session.answers || {});
    setScores(session.scores || {});
    toast.success("Interview session loaded.");
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Interview Copilot</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Practice, score, and improve answers</h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                Build role-specific interview prep sets from your resume and job description, then get AI feedback per answer.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/copilot">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Copilot
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/studio">Open Studio</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-3xl border border-slate-200/70 bg-white p-7">
            <div className="mb-5 flex items-center gap-2">
              <Brain className="h-5 w-5 text-slate-700" />
              <h2 className="text-2xl font-semibold text-slate-900">Create interview set</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Target role
                <Input value={role} onChange={(event) => setRole(event.target.value)} className="mt-1" placeholder="Cybersecurity Engineer" />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Company
                <Input value={company} onChange={(event) => setCompany(event.target.value)} className="mt-1" placeholder="Cloudflare" />
              </label>
            </div>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Job description
              <AutosizeTextarea
                className="mt-1"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the full JD here..."
              />
            </label>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={generateQuestions} disabled={generating}>
                <Sparkles className="mr-2 h-4 w-4" />
                {generating ? "Generating..." : "Generate interview questions"}
              </Button>
              <Button variant="outline" onClick={saveSession} disabled={saving || questions.length === 0}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save session (Pro)"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Answer completion: {completion}%</p>
          </article>

          <article className="rounded-3xl border border-slate-200/70 bg-white p-7">
            <h3 className="text-xl font-semibold text-slate-900">Saved sessions</h3>
            <div className="mt-4 space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-slate-500">No saved interview sessions yet.</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left"
                    onClick={() => loadSession(session)}
                  >
                    <p className="text-sm font-semibold text-slate-900">{session.role} at {session.company}</p>
                    <p className="text-xs text-slate-500">{new Date(session.updatedAt).toLocaleString()}</p>
                  </button>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-900">Interview practice</h3>
          {questions.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Generate an interview set to start practicing.
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {questions.map((question, index) => (
                <article key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Question {index + 1}</p>
                      <h4 className="mt-1 text-lg font-semibold text-slate-900">{question.question}</h4>
                      <p className="mt-1 text-xs text-slate-500">Focus: {question.focus}</p>
                    </div>
                    {scores[question.id] ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        Score {scores[question.id].score}/100
                      </span>
                    ) : null}
                  </div>

                  <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Your answer
                    <AutosizeTextarea
                      className="mt-1"
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: event.target.value,
                        }))
                      }
                      placeholder="Write your response here..."
                    />
                  </label>

                  <div className="mt-3">
                    <Button
                      variant="outline"
                      onClick={() => void scoreAnswer(question)}
                      disabled={scoringId === question.id}
                    >
                      {scoringId === question.id ? "Scoring..." : "Score my answer (Pro)"}
                    </Button>
                  </div>

                  {scores[question.id] ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">Feedback</p>
                      <p className="mt-1 text-sm text-slate-700">{scores[question.id].feedback}</p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">Improved answer</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{scores[question.id].improvedAnswer}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Interview scoring is part of Pro"
        description="Get answer scoring, improved responses, and saved interview sessions when you're ready."
        highlights={[
          "Score each answer with focused feedback",
          "Get improved answer drafts in seconds",
          "Save sessions and track prep progress over time",
        ]}
        primaryLabel="See Pro options"
        continueLabel="Keep practicing free"
      />
    </main>
  );
}
