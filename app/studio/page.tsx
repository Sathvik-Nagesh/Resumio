"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResumeStore } from "@/hooks/useResumeStore";
import { UploadModePanel } from "@/components/studio/modes/UploadModePanel";
import { TemplateModePanel } from "@/components/studio/modes/TemplateModePanel";
import { AIModePanel } from "@/components/studio/modes/AIModePanel";
import { ResumePreview } from "@/components/studio/ResumePreview";
import { ZoomIn, ZoomOut, Download, ArrowLeft, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { exportAsTxt } from "@/lib/export-txt";
import { exportAsPdf } from "@/lib/export-pdf";
import { exportAsDocx } from "@/lib/export-docx";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { CloudSyncStatus } from "@/components/premium/CloudSyncStatus";
import { useAuthResume } from "@/components/providers/AuthResumeProvider";
import { isPremiumTemplate } from "@/lib/premium";
import { trackEvent } from "@/lib/analytics";

export default function StudioPage() {
  const { resume, template } = useResumeStore();
  const { isPro, plan } = useAuthResume();
  const [zoom, setZoom] = useState(75);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const zoomLevels = [50, 60, 75, 85, 100];

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!isPro && (format === "docx" || isPremiumTemplate(template))) {
      void trackEvent({
        event: "paywall_hit",
        source: "studio_export",
        plan: "free",
        metadata: { format, template },
      });
      setShowUpgradeModal(true);
      toast.info("This export option is part of Pro.", {
        action: {
          label: "View Pro options",
          onClick: () => setShowUpgradeModal(true),
        },
      });
      return;
    }

    try {
      void trackEvent({
        event: "export_start",
        source: "studio",
        plan: isPro ? "pro" : "free",
        metadata: { format, template },
      });
      if (format === 'txt') {
        exportAsTxt(resume);
        toast.success("Resume exported as TXT!");
      } else if (format === 'docx') {
        await exportAsDocx(resume);
        toast.success("Resume exported as DOCX!");
      } else if (format === 'pdf') {
        await exportAsPdf(resume);
        toast.success("Resume exported as PDF!");
      }
      void trackEvent({
        event: "export_success",
        source: "studio",
        plan: isPro ? "pro" : "free",
        metadata: { format, template },
      });
    } catch (error) {
      // In development show the full error in the console for debugging.
      if (process.env.NODE_ENV !== "production") {
        console.error("Export error:", error);
      } else {
        // In production, avoid printing raw error objects to the console.
        // Send error details to a server-side logger/monitoring endpoint instead.
        try {
          const payload = {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            context: { action: "export", format },
            url: typeof window !== "undefined" ? window.location.href : undefined,
            ts: new Date().toISOString(),
          };

          // Prefer sendBeacon for fire-and-forget reliability.
          if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
            try {
              navigator.sendBeacon(
                "/api/log-error",
                new Blob([JSON.stringify(payload)], { type: "application/json" })
              );
            } catch (e) {
              // swallow — we don't want logging failures to surface to users
            }
          } else {
            // Fallback to a non-blocking fetch
            void fetch("/api/log-error", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }).catch(() => {});
          }
        } catch {
          // swallow any errors from the logging attempt
        }
      }

      // Keep user-facing message sanitized (no sensitive details).
      toast.error(`Failed to export as ${format.toUpperCase()}`);
      void trackEvent({
        event: "export_error",
        source: "studio",
        plan: isPro ? "pro" : "free",
        metadata: { format, template },
      });
    } finally {
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      {/* Header */}
      <header className="border-b border-white/40 bg-white/60 backdrop-blur-xl">
        <div className="container mx-auto max-w-[1920px] px-8 py-6 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Resumio Studio</p>
                <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">
                  Craft job-ready resumes
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isPro ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {plan}
              </span>
              {!isPro ? (
                <Button variant="subtle" size="sm" onClick={() => setShowUpgradeModal(true)}>
                  Explore Pro
                </Button>
              ) : null}
              <Button variant="outline" size="sm" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/copilot">Job Copilot</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/interview">Interview Copilot</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/analytics">Analytics</Link>
              </Button>
              <GoogleAuthButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Resume
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('docx')} className="gap-2">
                    <File className="h-4 w-4" />
                    Export as DOCX
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('txt')} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Export as TXT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <CloudSyncStatus />
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Two Column Layout */}
      <div className="container mx-auto max-w-[1920px] px-8 lg:px-12 xl:px-16">
        <div className="flex min-h-[calc(100vh-240px)] gap-8 py-8 lg:gap-12">
          {/* Left Column - Controls */}
          <div className="w-full lg:w-[45%] xl:w-[40%]">
            <Tabs defaultValue="upload" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="text-base">Upload</TabsTrigger>
                <TabsTrigger value="templates" className="text-base">Templates</TabsTrigger>
                <TabsTrigger value="ai" className="text-base">Create with AI</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <UploadModePanel />
              </TabsContent>

              <TabsContent value="templates">
                <TemplateModePanel />
              </TabsContent>

              <TabsContent value="ai">
                <AIModePanel />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Preview */}
          <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col">
            {/* Zoom Controls */}
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/40 bg-white/80 px-6 py-3 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Preview</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom === zoomLevels[0]}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[60px] text-center text-sm font-medium text-slate-700">{zoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom === zoomLevels[zoomLevels.length - 1]}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preview Container */}
            <div className="flex-1 overflow-auto rounded-[32px] border border-white/40 bg-white/60 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.18)] backdrop-blur-xl">
              <div className="flex min-h-full items-start justify-center">
                <div
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top center",
                  }}
                >
                  <ResumePreview data={resume} template={template} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="This workflow is part of Pro"
        description="Pro unlocks premium exports and advanced workflows whenever you're ready."
        primaryLabel="See Pro options"
        continueLabel="Keep exploring free"
      />
    </div>
  );
}
