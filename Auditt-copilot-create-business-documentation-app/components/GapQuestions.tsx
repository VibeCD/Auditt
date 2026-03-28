"use client";

import { useState } from "react";
import { GapQuestion } from "@/types";
import { cn } from "@/lib/utils";

interface GapQuestionsProps {
  questions: GapQuestion[];
  onComplete: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export function GapQuestions({ questions, onComplete, onSkip }: GapQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const requiredAnswered = questions
    .filter((q) => q.required)
    .every((q) => answers[q.id]?.trim());

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">
          {questions.length} quick question{questions.length !== 1 ? "s" : ""} to
          complete your pack — no typing needed for most!
        </p>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{q.question}</p>
              <p className="text-xs text-gray-400 mt-0.5">{q.section}</p>
            </div>
            {q.required && (
              <span className="ml-auto text-xs text-red-500 font-medium flex-shrink-0">Required</span>
            )}
          </div>

          {q.type === "toggle" && (
            <div className="flex gap-3 mt-2">
              {["Yes", "No"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.id, opt)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                    answers[q.id] === opt
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "multiple_choice" && q.options && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.id, opt)}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-sm font-medium transition-all text-left",
                    answers[q.id] === opt
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "number" && (
            <input
              type="number"
              min={0}
              placeholder="Enter number..."
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {q.type === "text_short" && (
            <input
              type="text"
              placeholder="Type here..."
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSkip}
          className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Skip — Generate with Drafts
        </button>
        <button
          onClick={() => onComplete(answers)}
          disabled={!requiredAnswered}
          className={cn(
            "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
            requiredAnswered
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          Generate Pack →
        </button>
      </div>
    </div>
  );
}
