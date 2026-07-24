"use client";

import { useState } from "react";
import { PlaygroundRunner } from "./playground";

interface Workflow {
  id: string;
  name: string;
  slug: string;
  usesInput: boolean;
}

export function PlaygroundHub({ workflows }: { workflows: Workflow[] }) {
  const [activeId, setActiveId] = useState(workflows[0]?.id);
  const active = workflows.find((w) => w.id === activeId) ?? workflows[0];

  return (
    <div className="mt-8 grid grid-cols-[200px_1fr] gap-6">
      <nav className="space-y-1">
        {workflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => setActiveId(wf.id)}
            className={`block w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors ${
              wf.id === active.id
                ? "bg-surface-2 font-medium text-fg"
                : "text-fg-muted hover:bg-surface hover:text-fg"
            }`}
          >
            {wf.name}
          </button>
        ))}
      </nav>

      <PlaygroundRunner
        key={active.id}
        workflowId={active.id}
        name={active.name}
        toolName={`run_workflow_${active.slug.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`}
        usesInput={active.usesInput}
      />
    </div>
  );
}
