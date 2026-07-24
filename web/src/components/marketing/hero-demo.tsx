"use client";

import { useRef, useState } from "react";
import { SparkleIcon as Sparkle, KeyReturnIcon as KeyReturn } from "@phosphor-icons/react";
import { HeroCanvas, type HeroCanvasHandle } from "@/components/marketing/hero-canvas";
import { AppWindow } from "@/components/marketing/app-window";
import { IsoCube } from "@/components/marketing/iso-cube";
import { SCENARIOS, SCENARIO_ORDER, type ScenarioId } from "@/components/marketing/scenarios";

export function HeroDemo() {
  const canvas = useRef<HeroCanvasHandle>(null);
  const [active, setActive] = useState<ScenarioId>("research");
  const [draft, setDraft] = useState("");

  function run(id: ScenarioId) {
    setActive(id);
    setDraft(SCENARIOS[id].prompt);
    canvas.current?.play(id);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.toLowerCase();
    const match =
      SCENARIO_ORDER.find((id) =>
        text.includes(SCENARIOS[id].label.split(" ")[0].toLowerCase()),
      ) ??
      (text.includes("lead")
        ? "leads"
        : text.includes("support") || text.includes("triage")
          ? "triage"
          : "research");
    run(match);
  }

  return (
    <div className="relative">
      <IsoCube className="absolute -right-4 -top-14 z-20 hidden md:block" />

      <form
        onSubmit={onSubmit}
        className="mx-auto mb-4 flex max-w-2xl items-center gap-2 rounded-full border border-border bg-surface/80 py-2 pl-4 pr-2 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-300 focus-within:border-accent/50 focus-within:shadow-[0_0_0_4px_var(--color-accent-tint),0_8px_30px_-16px_rgba(0,0,0,0.25)]"
      >
        <Sparkle size={16} weight="fill" className="shrink-0 text-accent" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Describe a workflow in plain English..."
          data-cursor
          className="min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-muted focus:outline-none"
          aria-label="Describe a workflow"
        />
        <button
          type="submit"
          data-cursor
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Build it
          <KeyReturn size={14} weight="bold" />
        </button>
      </form>

      <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-fg-muted">Try:</span>
        {SCENARIO_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => run(id)}
            data-cursor
            aria-pressed={active === id}
            className={[
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active === id
                ? "border-accent/40 bg-accent-tint text-accent"
                : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
            ].join(" ")}
          >
            {SCENARIOS[id].label}
          </button>
        ))}
      </div>

      <AppWindow>
        <div className="h-115" data-cursor>
          <HeroCanvas ref={canvas} />
        </div>
      </AppWindow>
    </div>
  );
}
