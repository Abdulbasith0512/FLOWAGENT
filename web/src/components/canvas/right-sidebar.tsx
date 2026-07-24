"use client";

import { cn } from "@/lib/utils";
import { StatusBadge, type RunPhase } from "./ui";

export type SidebarTab = "inspector" | "output" | "history";

export function RightSidebar({
  tab,
  onTabChange,
  runPhase,
  hasSelection,
  children,
}: {
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  runPhase: RunPhase;
  hasSelection: boolean;
  children: React.ReactNode;
}) {
  const tabs: { id: SidebarTab; label: string }[] = [
    { id: "inspector", label: "Inspector" },
    { id: "output", label: "Output" },
    { id: "history", label: "History" },
  ];

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-center gap-1 border-b border-border px-2 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-surface-2 text-fg"
                : "text-fg-muted hover:text-fg",
            )}
          >
            {t.label}
            {t.id === "inspector" && hasSelection && tab !== "inspector" && (
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            )}
            {t.id === "output" && runPhase !== "idle" && tab !== "output" && (
              <StatusDot phase={runPhase} />
            )}
          </button>
        ))}
        {runPhase !== "idle" && (
          <div className="ml-auto pr-1.5">
            <StatusBadge phase={runPhase} />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}

function StatusDot({ phase }: { phase: RunPhase }) {
  const color =
    phase === "error"
      ? "bg-err"
      : phase === "warning"
        ? "bg-accent"
        : phase === "done"
          ? "bg-ok"
          : "bg-run";
  return <span className={cn("h-1.5 w-1.5 rounded-full", color)} />;
}
