"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "auditt-theme-mode";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  root.dataset.theme = resolved;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" || saved === "system"
      ? saved
      : "system";
  });

  useEffect(() => {
    applyTheme(mode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if ((localStorage.getItem(STORAGE_KEY) || "system") === "system") {
        applyTheme("system");
        setTimeout(() => setMode("system"), 0);
      }
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode]);

  function onChange(nextMode: ThemeMode) {
    setMode(nextMode);
    localStorage.setItem(STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  }

  return (
    <div className="app-surface app-border rounded-xl p-1 inline-flex items-center gap-1">
      {(["light", "dark", "system"] as ThemeMode[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
            mode === option ? "btn-primary" : "app-muted hover:app-text"
          }`}
          aria-label={`Use ${option} theme`}
        >
          {option === "light" ? "☀️" : option === "dark" ? "🌙" : "🖥️"} {option}
        </button>
      ))}
    </div>
  );
}
