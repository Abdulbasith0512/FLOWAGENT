export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listPublishedWorkflows } from "@/lib/workflow/actions";
import { PlaygroundHub } from "@/components/mcp/playground-hub";

export default async function PlaygroundHubPage() {
  const workflows = await listPublishedWorkflows();

  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-16">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={14} /> Back to workflows
      </Link>

      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">
          MCP Playground
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">
          Test your tools
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Run any published workflow as an MCP tool, without Claude Desktop.
        </p>
      </div>

      {workflows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-fg-muted">
            No published workflows yet. Publish one from the canvas to test it here.
          </p>
        </div>
      ) : (
        <PlaygroundHub workflows={workflows} />
      )}
    </main>
  );
}
