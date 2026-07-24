export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { loadWorkflow } from "@/lib/workflow/actions";
import { Playground } from "@/components/mcp/playground";

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await loadWorkflow(id);
  if (!workflow) notFound();

  const usesInput = /\{\{\s*input\s*\}\}/.test(JSON.stringify(workflow.graph));

  return (
    <main className="mx-auto w-full max-w-2xl px-8 py-16">
      <Playground
        workflowId={workflow.id}
        name={workflow.name}
        toolName={`run_workflow_${workflow.slug}`}
        usesInput={usesInput}
      />
    </main>
  );
}
