"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

const DISMISS_KEY = "flowagent_onboarding_dismissed";

interface Props {
  hasNode: boolean;
  hasRun: boolean;
  published: boolean;
}

export function OnboardingChecklist({ hasNode, hasRun, published }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  const steps = [
    { label: "Add a node", done: hasNode },
    { label: "Run the workflow", done: hasRun },
    { label: "Publish to reuse it", done: published },
  ];
  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (dismissed) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 w-64 rounded-lg border border-border bg-surface p-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg">
          {allDone ? "You're all set" : "Get started"}
        </span>
        <button onClick={dismiss} className="text-fg-muted hover:text-fg" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>

      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                step.done
                  ? "border-ok bg-ok/20 text-ok"
                  : "border-border text-transparent"
              }`}
            >
              <Check size={10} />
            </span>
            <span className={step.done ? "text-fg-muted line-through" : "text-fg"}>
              {step.label}
            </span>
          </li>
        ))}
      </ul>

      {allDone && (
        <button
          onClick={dismiss}
          className="mt-3 w-full rounded-md border border-border px-3 py-1.5 text-xs text-fg-muted transition-colors hover:text-fg"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
