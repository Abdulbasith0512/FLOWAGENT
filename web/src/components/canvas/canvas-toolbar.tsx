"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, History, Play, Upload } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import { saveWorkflow } from "@/lib/workflow/actions";
import type { RunStatus } from "@/lib/ws/use-run-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface Props {
  workflowId: string;
  initialName: string;
  initialDescription: string;
  getGraph: () => { nodes: Node[]; edges: Edge[] };
  runStatus: RunStatus;
  dirty?: boolean;
  published?: boolean;
  unpublishedChanges?: boolean;
  onSaved?: () => void;
  onToggleHistory?: () => void;
  onPublish?: () => void;
  onRun: (input: string) => void;
  registerRun?: (run: () => void) => void;
}

export function CanvasToolbar({
  workflowId,
  initialName,
  initialDescription,
  getGraph,
  runStatus,
  dirty,
  published,
  unpublishedChanges,
  onSaved,
  onToggleHistory,
  onPublish,
  onRun,
  registerRun,
}: Props) {
  const [input, setInput] = useState("");
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onRunClickRef = useRef<() => void>(() => {});
  useEffect(() => {
    registerRun?.(() => onRunClickRef.current());
  }, [registerRun]);

  function persist() {
    return saveWorkflow({
      id: workflowId,
      name,
      description,
      graph: getGraph(),
    });
  }

  function onSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await persist();
        setMessage(
          result.ok ? "Saved" : `Saved · ${result.errors[0] ?? "has warnings"}`,
        );
        onSaved?.();
      } catch {
        setMessage("Save failed");
      }
    });
  }

  function onRunClick() {
    if (getGraph().nodes.length === 0) {
      setMessage("Add a node first");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await persist();
        onSaved?.();
        onRun(input);
      } catch {
        setMessage("Save failed");
      }
    });
  }
  onRunClickRef.current = onRunClick;

  return (
    <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2">
      <Link href="/app" className="text-fg-muted hover:text-fg">
        <ArrowLeft size={16} />
      </Link>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 max-w-48 font-medium"
        aria-label="Workflow name"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (used as the tool description)"
        className="h-8 flex-1"
        aria-label="Workflow description"
      />
      {message && <span className="text-xs text-fg-muted">{message}</span>}
      <ThemeToggle />
      <Button variant="ghost" size="sm" onClick={onToggleHistory} title="Run history">
        <History size={14} />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onSave}
        disabled={pending}
        data-canvas-save
      >
        {dirty && !pending && (
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        )}
        {pending ? "Saving…" : "Save"}
      </Button>
      {published && !unpublishedChanges ? (
        <Link
          href={`/app/${workflowId}/playground`}
          className="flex items-center gap-1.5 rounded-md border border-ok/30 px-2.5 py-1.5 text-sm text-ok transition-colors hover:bg-ok/10"
          title="Published and up to date. Open the playground to test it."
        >
          <Check size={14} />
          Published
        </Link>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={onPublish}
          title={
            published
              ? "You have changes that are not published yet"
              : "Publish this workflow"
          }
        >
          {published && unpublishedChanges ? (
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          ) : (
            <Upload size={14} />
          )}
          {published ? "Publish update" : "Publish"}
        </Button>
      )}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Input, used as {{input}}"
        className="h-8 w-44"
        aria-label="Run input"
        title="Text passed to the workflow as {{input}}"
      />
      <Button
        size="sm"
        onClick={onRunClick}
        disabled={runStatus === "running" || pending}
      >
        <Play size={14} />
        {runStatus === "running" ? "Running…" : "Run"}
      </Button>
    </header>
  );
}
