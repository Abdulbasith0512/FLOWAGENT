"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  X,
  Terminal,
  Webhook,
  FlaskConical,
  CheckCircle2,
} from "lucide-react";
import { publishWorkflow } from "@/lib/workflow/actions";

export function PublishDialog({
  workflowId,
  slug,
  published,
  onClose,
  onPublished,
}: {
  workflowId: string;
  slug: string;
  published: boolean;
  onClose: () => void;
  onPublished: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);
  const [succeeded, setSucceeded] = useState(false);
  const toolName = `run_workflow_${slug.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;

  function confirm() {
    setErrors([]);
    startTransition(async () => {
      const result = await publishWorkflow(workflowId);
      if (result.ok) {
        onPublished();
        setSucceeded(true);
      } else {
        setErrors(result.errors);
      }
    });
  }

  if (succeeded) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-bg/50 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-6 text-center">
            <CheckCircle2 size={28} className="mx-auto text-ok" />
            <h2 className="mt-3 text-sm font-semibold text-fg">Published</h2>
            <p className="mt-1 text-xs text-fg-muted">
              Your workflow is live as{" "}
              <code className="font-mono text-accent">{toolName}</code>.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
            >
              Done
            </button>
            <Link
              href={`/app/${workflowId}/playground`}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90"
            >
              <FlaskConical size={13} />
              Open playground
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">
            {published ? "Update published version" : "Publish workflow"}
          </h2>
          <button onClick={onClose} className="text-fg-muted hover:text-fg" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs leading-relaxed text-fg-muted">
            Publishing makes this workflow callable from outside the editor. Anyone with access
            can run it.
          </p>

          <div className="mt-4 space-y-3">
            <Method
              icon={<Terminal size={14} />}
              title="MCP tool"
              detail={toolName}
              mono
            />
            <Method
              icon={<Webhook size={14} />}
              title="Webhook & cron"
              detail="Trigger it on a schedule or a signed URL"
            />
            <Method
              icon={<FlaskConical size={14} />}
              title="Playground"
              detail="Test it without Claude Desktop"
            />
          </div>

          {errors.length > 0 && (
            <p className="mt-3 rounded-md border border-err/30 bg-err/5 px-3 py-2 text-xs text-err">
              {errors[0]}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={pending}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Publishing…" : published ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Method({
  icon,
  title,
  detail,
  mono,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent-tint text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-fg">{title}</p>
        <p
          className={`truncate text-[11px] text-fg-muted ${mono ? "font-mono" : ""}`}
        >
          {detail}
        </p>
      </div>
    </div>
  );
}
