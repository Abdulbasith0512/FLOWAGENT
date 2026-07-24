"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateWorkflow, createFromTemplate } from "@/lib/workflow/actions";
import { TEMPLATES } from "@/lib/workflow/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Frame } from "@/components/brand/frame";
import { Kicker } from "@/components/brand/kicker";

export function GenerateBar() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onGenerate() {
    if (!description.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const id = await generateWorkflow(description);
        router.push(`/app/${id}`);
      } catch {
        setError("Could not generate. Try rephrasing or build it manually.");
      }
    });
  }

  function onTemplate(slug: string) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createFromTemplate(slug);
        router.push(`/app/${id}`);
      } catch {
        setError("Could not create from this template. Please try again.");
      }
    });
  }

  return (
    <Frame className="rounded-xl p-6">
      <Kicker>Describe a workflow</Kicker>
      <div className="mt-3 flex gap-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onGenerate()}
          placeholder="Search for a company, summarize it, and email me the result"
          className="h-10"
        />
        <Button onClick={onGenerate} disabled={pending} className="h-10 shrink-0">
          <Sparkles size={15} />
          {pending ? "Generating…" : "Generate"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-err">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.slug}
            onClick={() => onTemplate(t.slug)}
            disabled={pending}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {t.name}
          </button>
        ))}
      </div>
    </Frame>
  );
}
