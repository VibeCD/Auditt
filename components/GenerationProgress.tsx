"use client";

import { cn } from "@/lib/utils";

interface ProgressStep {
  label: string;
  done: boolean;
  active: boolean;
}

interface GenerationProgressProps {
  steps: ProgressStep[];
  currentStep: number;
}

export function GenerationProgress({
  steps,
  currentStep,
}: GenerationProgressProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all duration-500",
              step.done
                ? "bg-emerald-50 border-emerald-200"
                : step.active
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300",
                step.done
                  ? "bg-emerald-500 text-white"
                  : step.active
                    ? "bg-blue-500 text-white animate-pulse"
                    : "bg-gray-200 text-gray-500"
              )}
            >
              {step.done ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                step.done
                  ? "text-emerald-700"
                  : step.active
                    ? "text-blue-700"
                    : "text-gray-400"
              )}
            >
              {step.label}
            </span>
            {step.active && (
              <div className="ml-auto flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-500 mt-4">
        Step {Math.min(currentStep + 1, steps.length)} of {steps.length} —{" "}
        {steps[currentStep]?.label}
      </p>
    </div>
  );
}
