"use client";

import { useState } from "react";
import { GeneratedPack, Niche } from "@/types";
import { cn } from "@/lib/utils";

interface ResultsViewerProps {
  pack: GeneratedPack;
  onExportPdf: () => void;
  onRegenerate: (sectionId: string, action: string) => void;
  isExporting: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  sop: "📋",
  checklist: "✅",
  form: "📝",
  policy: "📜",
  log: "📊",
  cover: "📁",
};

const TYPE_COLORS: Record<Niche, { bg: string; text: string; badge: string }> = {
  restaurant: { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  daycare: { bg: "bg-sky-50", text: "text-sky-700", badge: "bg-sky-100 text-sky-700" },
  clinic: { bg: "bg-teal-50", text: "text-teal-700", badge: "bg-teal-100 text-teal-700" },
};

const SECTION_ACTIONS = [
  { id: "shorten", label: "Shorten", icon: "✂️" },
  { id: "formal", label: "More formal", icon: "🎩" },
  { id: "checklist", label: "As checklist", icon: "☑️" },
  { id: "responsibilities", label: "Add responsibilities", icon: "👤" },
];

export function ResultsViewer({
  pack,
  onExportPdf,
  onRegenerate,
  isExporting,
}: ResultsViewerProps) {
  const [activeSection, setActiveSection] = useState<string>(
    pack.sections[0]?.id || ""
  );
  const colors = TYPE_COLORS[pack.niche] || TYPE_COLORS.restaurant;
  const currentSection = pack.sections.find((s) => s.id === activeSection);
  const draftCount = pack.sections.filter((s) => s.isDraft).length;

  return (
    <div className="flex h-full min-h-[600px] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 text-sm truncate">{pack.businessName}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {pack.version} · {pack.sections.length} documents
          </p>
          {draftCount > 0 && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 text-xs text-amber-700">
              ⚠️ {draftCount} section{draftCount !== 1 ? "s" : ""} need review
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {pack.sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all",
                activeSection === s.id
                  ? `${colors.bg} ${colors.text} font-semibold`
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5 flex-shrink-0">
                  {TYPE_ICONS[s.type] || "📄"}
                </span>
                <span className="leading-tight">{s.title}</span>
              </div>
              {s.isDraft && (
                <span className="ml-7 text-xs font-normal text-amber-600 mt-0.5 block">
                  Draft
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 space-y-2">
          <button
            onClick={onExportPdf}
            disabled={isExporting}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow"
          >
            {isExporting ? "Preparing..." : "⬇ Download Binder PDF"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentSection ? (
          <>
            {/* Section header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TYPE_ICONS[currentSection.type]}</span>
                  <h3 className="font-bold text-gray-900">{currentSection.title}</h3>
                  {currentSection.isDraft && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Draft — Needs Review
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 ml-7 capitalize">
                  {currentSection.type}
                </p>
              </div>
              {/* Action buttons */}
              <div className="flex gap-1.5">
                {SECTION_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onRegenerate(currentSection.id, action.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                    title={action.label}
                  >
                    <span>{action.icon}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document content */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentSection.missingItems.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    Items needing review:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {currentSection.missingItems.slice(0, 5).map((item, i) => (
                      <li key={i} className="text-xs text-amber-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div
                className="prose prose-sm max-w-none document-content"
                dangerouslySetInnerHTML={{ __html: currentSection.content }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a section from the sidebar
          </div>
        )}
      </main>
    </div>
  );
}
