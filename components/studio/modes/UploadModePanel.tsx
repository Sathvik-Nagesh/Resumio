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
                        Accepts PDF or DOCX files. We&apos;ll extract sections, rewrite bullets with Gemini (optional), and calculate
                        ATS readiness instantly.
                    </CardDescription>
                    <Input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
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
                            </div>
                            {atsScore.breakdown.explanation.length ? (
                                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
                                    {atsScore.breakdown.explanation.map((tip) => (
                                        <li key={tip}>{tip}</li>
                                    ))}
                                </ul>
                            ) : null}
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
