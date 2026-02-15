"use client";

import { useState } from "react";
import { Gauge, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { useResumeStore } from "@/hooks/useResumeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeAtsScore } from "@/lib/ats";

export function UploadModePanel() {
    const {
        resume,
        setResume,
        setAtsScore,
        setLoading,
        isLoading,
        jobDescription,
        setJobDescription,
        atsScore,
    } = useResumeStore();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please choose a PDF or DOCX to upload");
            return;
        }

        setLoading("upload", true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (jobDescription) {
            formData.append("jobDescription", jobDescription);
        }

        try {
                const response = await fetch("/api/parse-resume", {
                    method: "POST",
                    body: formData,
                });

                // Safely parse the response body. Some responses may be empty or not JSON.
                const contentType = response.headers.get("content-type") || "";
                let result: any = null;

                if (response.status === 204) {
                    // No content
                    result = null;
                } else if (contentType.includes("application/json")) {
                    try {
                        result = await response.json();
                    } catch (err) {
                        console.error("Failed to parse JSON response from /api/parse-resume:", err);
                        // Fallback to text to surface any error message the server might have sent
                        const txt = await response.text().catch(() => null);
                        result = txt ? { text: txt } : null;
                    }
                } else {
                    // Not JSON — try to read as text for debugging/fallback
                    const txt = await response.text().catch(() => null);
                    result = txt ? { text: txt } : null;
                }

                if (!response.ok) {
                    const serverMessage = result?.error || result?.text || `Status ${response.status}`;
                    throw new Error(serverMessage || "Parsing failed");
                }

                if (!result || !result.resume) {
                    console.error("/api/parse-resume returned unexpected shape:", result);
                    throw new Error("Resume parsing returned no result");
                }

                setResume(result.resume);
                setAtsScore(result.atsScore);
                toast.success("Resume parsed and scored");
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "There was an issue parsing your resume";
            toast.error(errorMessage);
        } finally {
            setLoading("upload", false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-white/40 bg-white/85">
                <CardHeader className="gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                        <UploadCloud className="h-5 w-5" />
                    </div>
                    <CardTitle>Upload existing resume</CardTitle>
                    <CardDescription>
                        Accepts PDF, DOCX, and image resumes. We extract text, run OCR fallback when needed, and score ATS readiness.
                    </CardDescription>
                    <Input type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} />
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={handleUpload} disabled={isLoading.upload}>
                            {isLoading.upload ? "Analyzing..." : "Parse & score"}
                        </Button>
                        {selectedFile ? (
                            <span className="text-sm text-slate-500">Selected: {selectedFile.name}</span>
                        ) : null}
                    </div>
                </CardHeader>
            </Card>

            <Card className="border-white/40 bg-white/85">
                <CardHeader className="gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                        <Gauge className="h-5 w-5" />
                    </div>
                    <CardTitle>ATS score + job description</CardTitle>
                    <CardDescription>
                        Paste a job description to tailor keyword recommendations and improve ATS alignment.
                    </CardDescription>
                    <AutosizeTextarea
                        placeholder="Paste the JD here so we can highlight missing keywords..."
                        value={jobDescription}
                        onChange={(event) => setJobDescription(event.target.value)}
                        rows={6}
                    />
                    {jobDescription && resume && (
                        <Button
                            onClick={() => {
                                const newScore = computeAtsScore(resume, jobDescription);
                                setAtsScore(newScore);
                                toast.success("ATS score updated with job description!");
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            Recalculate ATS Score
                        </Button>
                    )}
                    {atsScore ? (
                        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Overall score</p>
                            <p className="mt-1 text-3xl font-semibold text-slate-900">{atsScore.score}/100</p>
                            <div className="mt-4 grid gap-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Structure</span>
                                    <span>{atsScore.breakdown.structure}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Keywords</span>
                                    <span>{atsScore.breakdown.keywords}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Impact</span>
                                    <span>{atsScore.breakdown.impact}</span>
                                </div>
                                {typeof atsScore.breakdown.quality === "number" ? (
                                    <div className="flex items-center justify-between">
                                        <span>Quality</span>
                                        <span>{atsScore.breakdown.quality}</span>
                                    </div>
                                ) : null}
                                {typeof atsScore.breakdown.parseConfidence === "number" ? (
                                    <div className="flex items-center justify-between">
                                        <span>Parse confidence</span>
                                        <span>{atsScore.breakdown.parseConfidence}</span>
                                    </div>
                                ) : null}
                                {atsScore.breakdown.roleProfile ? (
                                    <div className="flex items-center justify-between">
                                        <span>Role profile</span>
                                        <span className="capitalize">{atsScore.breakdown.roleProfile}</span>
                                    </div>
                                ) : null}
                                {typeof atsScore.breakdown.aiAdjustment === "number" ? (
                                    <div className="flex items-center justify-between">
                                        <span>AI adjustment</span>
                                        <span>{atsScore.breakdown.aiAdjustment > 0 ? `+${atsScore.breakdown.aiAdjustment}` : atsScore.breakdown.aiAdjustment}</span>
                                    </div>
                                ) : null}
                            </div>
                            {atsScore.breakdown.explanation.length ? (
                                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
                                    {atsScore.breakdown.explanation.map((tip) => (
                                        <li key={tip}>{tip}</li>
                                    ))}
                                </ul>
                            ) : null}
                            <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                                    ATS debug view
                                </summary>
                                <div className="mt-3 space-y-3 text-sm text-slate-700">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Matched keywords</p>
                                        {atsScore.breakdown.keywordMatches.length > 0 ? (
                                            <p className="mt-1">{atsScore.breakdown.keywordMatches.join(", ")}</p>
                                        ) : (
                                            <p className="mt-1 text-slate-500">No strong matches yet.</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Missing priority keywords</p>
                                        {atsScore.breakdown.missingKeywords && atsScore.breakdown.missingKeywords.length > 0 ? (
                                            <p className="mt-1">{atsScore.breakdown.missingKeywords.join(", ")}</p>
                                        ) : (
                                            <p className="mt-1 text-slate-500">No major gaps detected.</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Section penalties</p>
                                        {atsScore.breakdown.sectionPenalties && atsScore.breakdown.sectionPenalties.length > 0 ? (
                                            <ul className="mt-1 list-disc space-y-1 pl-5">
                                                {atsScore.breakdown.sectionPenalties.map((penalty) => (
                                                    <li key={penalty}>{penalty}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="mt-1 text-slate-500">No major penalties detected.</p>
                                        )}
                                    </div>
                                    {atsScore.breakdown.weights ? (
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scoring weights</p>
                                            <p className="mt-1">
                                                Structure {Math.round(atsScore.breakdown.weights.structure * 100)}%,
                                                Keywords {Math.round(atsScore.breakdown.weights.keywords * 100)}%,
                                                Impact {Math.round(atsScore.breakdown.weights.impact * 100)}%,
                                                Quality {Math.round(atsScore.breakdown.weights.quality * 100)}%
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </details>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Upload a resume to unlock ATS scoring, keyword overlaps, and actionable tips.
                        </p>
                    )}
                </CardHeader>
            </Card>
        </div>
    );
}
