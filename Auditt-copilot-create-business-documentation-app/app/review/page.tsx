"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ResultsViewer } from "@/components/ResultsViewer";
import { GeneratedPack } from "@/types";
import Link from "next/link";

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");

  const [pack, setPack] = useState<GeneratedPack | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/");
      return;
    }
    const stored = sessionStorage.getItem(`pack_${sessionId}`);
    if (!stored) {
      router.replace("/");
      return;
    }
    try {
      setPack(JSON.parse(stored));
    } catch {
      router.replace("/");
    }
  }, [sessionId, router]);

  async function handleExportPdf() {
    if (!pack) return;
    setIsExporting(true);
    setError(null);
    try {
      const resp = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pack),
      });

      if (!resp.ok) throw new Error("Export failed");

      const html = await resp.text();
      // Open in new tab for printing / saving as PDF
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.addEventListener("load", () => {
          setTimeout(() => win.print(), 500);
        });
      }
    } catch {
      setError("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleRegenerate(sectionId: string, action: string) {
    if (!pack) return;
    // Find section
    const section = pack.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const actionPrompts: Record<string, string> = {
      shorten: "Make this document shorter and more concise.",
      formal: "Rewrite this in a more formal, professional tone.",
      checklist: "Convert the main procedures in this document into a bullet checklist.",
      responsibilities: "Add a clear responsibilities section showing who does each task.",
    };

    const actionText = actionPrompts[action] || action;

    // For now show a visual feedback — full regen would require another API call
    setPack((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                content:
                  `<div class="regen-notice">` +
                  `ℹ️ <strong>Improvement requested:</strong> "${actionText}" — ` +
                  `Regeneration with AI requires the Generate Pack flow to be re-run with this preference noted.` +
                  `</div>` + s.content,
              }
            : s
        ),
      };
    });
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-blue-300 text-sm">Loading your pack...</p>
        </div>
      </div>
    );
  }

  const draftCount = pack.sections.filter((s) => s.isDraft).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-300 hover:text-white text-sm transition-colors">
              ← New Pack
            </Link>
            <span className="text-blue-700">|</span>
            <div>
              <h1 className="text-xl font-bold text-white">{pack.businessName}</h1>
              <p className="text-xs text-blue-300">
                {(pack.generationMode === "custom" ? "Custom Pack" : `${pack.niche.charAt(0).toUpperCase() + pack.niche.slice(1)} Compliance Binder`)} ·{" "}
                {pack.version} · {pack.sections.length} documents
              </p>
              {pack.generationMode === "custom" && (
                <p className="text-[11px] text-blue-400 mt-0.5">
                  Audience: {pack.customAudience || "general"} · Tone: {pack.customTone || "simple"}
                </p>
              )}
              <p className="text-[11px] text-blue-400 mt-0.5">
                Language: {pack.languageMode === "bilingual"
                  ? `${pack.targetLanguageName || "English"} + English`
                  : (pack.targetLanguageName || "English")}
                {pack.targetLanguageCode ? ` (${pack.targetLanguageCode})` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {draftCount > 0 && (
              <div className="bg-amber-900/40 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg">
                ⚠️ {draftCount} draft section{draftCount !== 1 ? "s" : ""} — review before use
              </div>
            )}
            {pack.status === "ready" && (
              <div className="bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-lg">
                ✅ Pack ready
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 todo-highlight border rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {pack.warnings && pack.warnings.length > 0 && (
          <div className="mb-4 todo-highlight border rounded-lg px-4 py-3 text-xs">
            <p className="font-semibold text-amber-300 mb-1">Generation warnings</p>
            <ul className="list-disc list-inside space-y-0.5">
              {pack.warnings.slice(0, 5).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer banner */}
        <div className="mb-4 app-surface app-border rounded-lg px-4 py-3 text-xs app-muted">
          <strong>Review recommended:</strong> This documentation was AI-generated. Always verify with your local regulations before use. Items marked &ldquo;Draft&rdquo; require manual review.
        </div>

        <ResultsViewer
          pack={pack}
          onExportPdf={handleExportPdf}
          onRegenerate={handleRegenerate}
          isExporting={isExporting}
        />
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <ReviewPageContent />
    </Suspense>
  );
}
