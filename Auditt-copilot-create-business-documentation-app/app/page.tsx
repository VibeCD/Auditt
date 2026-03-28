import Link from "next/link";
import { NICHES } from "@/lib/niches";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-blue-200">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          AI-Powered Compliance Documentation
        </div>
        <h1 className="text-5xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-white via-blue-100 to-teal-300 bg-clip-text text-transparent">
          Turn messy notes into<br />a professional Compliance Binder
        </h1>
        <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
          Upload your documents, photos, or notes — no prompting needed. Auditt reads,
          organises, and generates ready-to-use SOPs, checklists, and forms in minutes.
        </p>

        {/* Features strip */}
        <div className="flex flex-wrap justify-center gap-4 mb-14 text-sm">
          {[
            "No prompt writing",
            "One-click Generate",
            "≤5 minutes to first result",
            "Downloadable PDF Binder",
            "Draft warnings on uncertain items",
          ].map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-blue-100"
            >
              <span className="text-green-400">✓</span> {f}
            </span>
          ))}
        </div>
      </div>

      {/* Mode cards */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-center text-2xl font-bold text-white mb-3">
          Choose your mode to get started
        </h2>
        <p className="text-center text-blue-300 text-sm mb-10">
          Guided mode gives niche-optimized compliance packs. Custom mode works for students, teachers, professionals, and general users.
        </p>
        <div className="mb-6">
          <Link
            href="/upload?mode=custom"
            className="group block bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
              ✨
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Custom Pack (any user)</h3>
            <p className="text-sm text-blue-200 mb-4 leading-relaxed">
              Schema-first generation for student notes, teacher plans, professional reports, and more — no prompt writing needed.
            </p>
            <div className="space-y-1.5 mb-5">
              {["Notes → Summary + Checklist", "Notes → Study Plan", "Notes → Report Draft"].map((doc) => (
                <div key={doc} className="flex items-start gap-2 text-xs text-blue-300">
                  <span className="text-teal-400 mt-0.5 flex-shrink-0">›</span>
                  {doc}
                </div>
              ))}
            </div>
            <div className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl text-white text-sm font-bold text-center shadow group-hover:shadow-lg transition-shadow">
              Start Custom Pack →
            </div>
          </Link>
        </div>
        <h3 className="text-center text-lg font-semibold text-white mb-4">Or choose a guided niche</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NICHES.map((niche) => (
            <Link
              key={niche.id}
              href={`/upload?niche=${niche.id}`}
              className="group block bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${niche.color} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}
              >
                {niche.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{niche.label}</h3>
              <p className="text-sm text-blue-200 mb-4 leading-relaxed">
                {niche.description}
              </p>
              <div className="space-y-1.5 mb-5">
                {niche.documents.slice(0, 4).map((doc) => (
                  <div key={doc} className="flex items-start gap-2 text-xs text-blue-300">
                    <span className="text-teal-400 mt-0.5 flex-shrink-0">›</span>
                    {doc}
                  </div>
                ))}
                {niche.documents.length > 4 && (
                  <div className="text-xs text-blue-400">
                    +{niche.documents.length - 4} more documents
                  </div>
                )}
              </div>
              <div
                className={`w-full py-2.5 bg-gradient-to-r ${niche.color} rounded-xl text-white text-sm font-bold text-center shadow group-hover:shadow-lg transition-shadow`}
              >
                Start {niche.label.split(" / ")[0]} Binder →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-white/10 bg-white/5">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-white mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                icon: "📤",
                title: "Upload",
                desc: "Drop your notes, PDFs, photos of checklists — anything.",
              },
              {
                step: "2",
                icon: "🤖",
                title: "AI Reads",
                desc: "Our AI extracts facts, spots gaps, and asks ≤7 quick questions.",
              },
              {
                step: "3",
                icon: "📋",
                title: "Generate Pack",
                desc: "One click. AI writes all your SOPs, checklists, and forms.",
              },
              {
                step: "4",
                icon: "⬇️",
                title: "Download",
                desc: "Get a branded, versioned Binder PDF — inspection-ready.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-2xl mb-3 shadow">
                  {item.icon}
                </div>
                <h3 className="font-bold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-blue-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-3xl mx-auto px-6 py-8 text-center">
        <p className="text-xs text-blue-400 leading-relaxed">
          <strong className="text-blue-300">Important:</strong> This tool helps generate documentation and checklists.
          It is not legal advice. Always review and adapt to your local regulations.
          Items marked &ldquo;Draft / Needs Review&rdquo; require manual verification before use.
        </p>
      </div>
    </main>
  );
}
