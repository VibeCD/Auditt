"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import { GapQuestions } from "@/components/GapQuestions";
import { GenerationProgress } from "@/components/GenerationProgress";
import { getNicheById } from "@/lib/niches";
import { generateSessionId } from "@/lib/utils";
import { GeneratedPack, Niche, UploadedFile } from "@/types";
import Link from "next/link";

type Stage = "upload" | "generating-gaps" | "gaps" | "generating-docs" | "done" | "error";

const PROGRESS_STEPS = [
  "Reading your files",
  "Organising notes into sections",
  "Checking for missing details",
  "Writing documents",
  "Building binder",
];

const SECONDARY_LANGUAGE = "English";

const COMMON_LANGUAGES = [
  { name: "English", code: "en" },
  { name: "Hindi", code: "hi" },
  { name: "Kannada", code: "kn" },
  { name: "Tamil", code: "ta" },
  { name: "Telugu", code: "te" },
  { name: "Urdu", code: "ur" },
  { name: "Spanish", code: "es" },
  { name: "Arabic", code: "ar" },
  { name: "French", code: "fr" },
  { name: "German", code: "de" },
];

function UploadPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nicheId = searchParams.get("niche") as Niche | null;
  const niche = nicheId ? getNicheById(nicheId) : null;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [stage, setStage] = useState<Stage>("upload");
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<GeneratedPack | null>(null);
  const [cloudSave, setCloudSave] = useState(false);
  const [languageMode, setLanguageMode] = useState<"single" | "bilingual">("single");
  const [targetLanguageName, setTargetLanguageName] = useState("English");
  const [targetLanguageCode, setTargetLanguageCode] = useState("en");
  const [sessionId] = useState(() => generateSessionId());

  useEffect(() => {
    if (!niche) {
      router.replace("/");
    }
  }, [niche, router]);

  if (!niche) return null;

  async function startGeneration() {
    setError(null);
    setStage("generating-gaps");
    setProgressStep(0);

    try {
      // Simulate step progression
      const stepTimer = setInterval(() => {
        setProgressStep((s) => Math.min(s + 1, 2));
      }, 2000);

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche!.id,
          files,
          pastedText,
          sessionId,
          cloudSave,
          languageMode,
          targetLanguageName,
          targetLanguageCode,
        }),
      });

      clearInterval(stepTimer);
      setProgressStep(2);

      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Generation failed");

      const generatedPack: GeneratedPack = data.pack;
      setPack(generatedPack);

      if (generatedPack.gapQuestions && generatedPack.gapQuestions.length > 0) {
        setStage("gaps");
      } else {
        // No gap questions, go straight to doc generation
        await generateDocs({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("error");
    }
  }

  async function generateDocs(gapAnswers: Record<string, string>) {
    setStage("generating-docs");
    setProgressStep(3);

    try {
      const stepTimer = setInterval(() => {
        setProgressStep((s) => Math.min(s + 1, 4));
      }, 4000);

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche!.id,
          files,
          pastedText,
          sessionId,
          gapAnswers,
          cloudSave,
          languageMode,
          targetLanguageName,
          targetLanguageCode,
        }),
      });

      clearInterval(stepTimer);
      setProgressStep(4);

      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Generation failed");

      setPack(data.pack);
      // Save pack to sessionStorage for results page
      sessionStorage.setItem(`pack_${sessionId}`, JSON.stringify(data.pack));
      setStage("done");

      // Navigate to results
      router.push(`/review?session=${sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("error");
    }
  }

  const hasContent = files.length > 0 || pastedText.trim().length > 0;
  const isGenerating = stage === "generating-gaps" || stage === "generating-docs";

  const progressSteps = PROGRESS_STEPS.map((label, i) => ({
    label,
    done: i < progressStep,
    active: i === progressStep && isGenerating,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="text-blue-300 hover:text-white text-sm transition-colors"
          >
            ← Back
          </Link>
          <span className="text-blue-600">|</span>
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${niche.color} flex items-center justify-center text-lg`}>
            {niche.icon}
          </div>
          <h1 className="text-lg font-bold text-white">{niche.label} Binder</h1>
        </div>

        {/* Stage indicator */}
        {(stage === "upload" || stage === "error") && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Upload your documents
            </h2>
            <p className="text-blue-300 text-sm">
              Drop in any messy notes, PDFs, images, or paste text below.
              No formatting needed — our AI handles everything.
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Building your pack...</h2>
            <p className="text-blue-300 text-sm mb-8">
              This may take 1–3 minutes. Hang tight!
            </p>
            <GenerationProgress steps={progressSteps} currentStep={progressStep} />
          </div>
        )}

        {stage === "gaps" && pack && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Almost there! A few quick questions
            </h2>
            <p className="text-blue-300 text-sm">
              These help fill gaps in your documents. No typing needed for most.
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        {stage === "upload" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <FileUpload
              files={files}
              onFilesAdded={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
              onFileRemoved={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            />

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Or paste text notes here (WhatsApp messages, emails, notes...)
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste any text here — cleaning schedules, staff rules, procedures, anything..."
                rows={5}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            {/* Document list preview */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-300 mb-2">
                Documents that will be generated:
              </p>
              <div className="space-y-1">
                {niche.documents.map((doc) => (
                  <div key={doc} className="flex items-center gap-2 text-xs text-blue-200">
                    <span className="text-teal-400">›</span> {doc}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cloudSave}
                  onChange={(e) => setCloudSave(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Enable Cloud Save (optional)</p>
                  <p className="text-xs text-blue-300 mt-1">
                    Off: instant task, no data persisted. On: save generated logs/metadata and uploaded file info to cloud storage.
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
              <p className="text-sm font-semibold text-white">Output language</p>
              <label htmlFor="target-language-name" className="sr-only">
                Target language name
              </label>
              <input
                id="target-language-name"
                list="language-options"
                value={targetLanguageName}
                onChange={(e) => {
                  const value = e.target.value;
                  setTargetLanguageName(value);
                  const matched = COMMON_LANGUAGES.find(
                    (lang) => lang.name.toLowerCase() === value.toLowerCase()
                  );
                  setTargetLanguageCode(matched?.code || "");
                }}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-blue-300/60"
                placeholder="Type language name (e.g. Spanish, 日本語, Arabic)"
              />
              <datalist id="language-options">
                {COMMON_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name} />
                ))}
              </datalist>

              <div className="flex flex-wrap gap-2">
                {COMMON_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setTargetLanguageName(lang.name);
                      setTargetLanguageCode(lang.code);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      targetLanguageName.toLowerCase() === lang.name.toLowerCase()
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-white/5 border-white/20 text-blue-200 hover:bg-white/10"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguageMode("single")}
                  className={`py-2 rounded-lg text-xs font-medium border ${
                    languageMode === "single"
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-white/5 border-white/20 text-blue-200"
                  }`}
                >
                  Single language
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageMode("bilingual")}
                  className={`py-2 rounded-lg text-xs font-medium border ${
                    languageMode === "bilingual"
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-white/5 border-white/20 text-blue-200"
                  }`}
                >
                  Bilingual ({SECONDARY_LANGUAGE} + selected)
                </button>
              </div>

              <p className="text-[11px] text-blue-300">
                Selected: {languageMode === "bilingual" ? `${targetLanguageName} + ${SECONDARY_LANGUAGE}` : targetLanguageName}
                {targetLanguageCode ? ` (${targetLanguageCode})` : ""}
              </p>
            </div>

            <button
              onClick={startGeneration}
              disabled={!hasContent}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                hasContent
                  ? `bg-gradient-to-r ${niche.color} hover:opacity-90 hover:shadow-xl hover:scale-[1.01] text-white`
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              🚀 Generate Pack
            </button>
            {!hasContent && (
              <p className="text-center text-xs text-blue-400">
                Upload at least one file or paste some text to continue
              </p>
            )}
          </div>
        )}

        {stage === "gaps" && pack && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <GapQuestions
              questions={pack.gapQuestions}
              onComplete={generateDocs}
              onSkip={() => generateDocs({})}
            />
          </div>
        )}

        {stage === "error" && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-6 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-lg font-bold text-red-300">Something went wrong</h3>
            <p className="text-sm text-red-200">{error}</p>
            <button
              onClick={() => setStage("upload")}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <UploadPageContent />
    </Suspense>
  );
}
