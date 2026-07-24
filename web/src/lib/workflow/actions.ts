"use server";

import { eq, and, or, desc, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import {
  personalWorkspace,
  requireWorkflowAccess,
} from "@/lib/workspace/rbac";
import { workflowGraphSchema, type WorkflowGraph } from "./types";
import { validateGraph } from "./validate";
import { migrateGraph, CURRENT_SCHEMA_VERSION } from "./migrate";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "workflow"
  );
}

export async function listWorkflows() {
  const user = await requireUser();
  const memberWorkspaces = db
    .select({ id: schema.memberships.workspaceId })
    .from(schema.memberships)
    .where(eq(schema.memberships.userId, user.id));

  return db
    .select({
      id: schema.workflows.id,
      name: schema.workflows.name,
      updatedAt: schema.workflows.updatedAt,
    })
    .from(schema.workflows)
    .where(
      or(
        eq(schema.workflows.userId, user.id),
        inArray(schema.workflows.workspaceId, memberWorkspaces),
      ),
    )
    .orderBy(desc(schema.workflows.updatedAt));
}

export async function listPublishedWorkflows() {
  const user = await requireUser();
  const rows = await db
    .select({
      id: schema.workflows.id,
      name: schema.workflows.name,
      slug: schema.workflows.slug,
      publishedGraph: schema.workflows.publishedGraph,
    })
    .from(schema.workflows)
    .where(
      and(
        eq(schema.workflows.userId, user.id),
        isNotNull(schema.workflows.publishedAt),
      ),
    )
    .orderBy(desc(schema.workflows.updatedAt));
  return rows.map(({ publishedGraph, ...rest }) => ({
    ...rest,
    usesInput: /\{\{\s*input\s*\}\}/.test(JSON.stringify(publishedGraph)),
  }));
}

async function uniqueSlug(userId: string, base: string): Promise<string> {
  const taken = new Set(
    (
      await db
        .select({ slug: schema.workflows.slug })
        .from(schema.workflows)
        .where(eq(schema.workflows.userId, userId))
    ).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}_${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export async function createWorkflow(name: string) {
  const user = await requireUser();
  const workspaceId = await personalWorkspace(user.id);
  const slug = await uniqueSlug(user.id, slugify(name));
  const [row] = await db
    .insert(schema.workflows)
    .values({
      userId: user.id,
      workspaceId,
      name,
      slug,
      graph: { nodes: [], edges: [] },
    })
    .returning({ id: schema.workflows.id });
  return row.id;
}

export async function loadWorkflow(id: string) {
  const user = await requireUser();
  if (!(await requireWorkflowAccess(id, user.id, "viewer"))) return null;
  const [row] = await db
    .select()
    .from(schema.workflows)
    .where(eq(schema.workflows.id, id))
    .limit(1);
  if (!row) return null;

  const parsed = workflowGraphSchema.safeParse(row.graph);
  if (parsed.success) {
    const { graph } = migrateGraph(parsed.data, row.schemaVersion ?? 1);
    return { ...row, graph };
  }
  return row;
}

export async function saveWorkflow(input: {
  id: string;
  name: string;
  description: string;
  graph: unknown;
}) {
  const user = await requireUser();
  if (!(await requireWorkflowAccess(input.id, user.id, "editor"))) {
    throw new Error("Not authorized");
  }

  const graph = workflowGraphSchema.parse(input.graph);
  const validation = validateGraph(graph);

  const [updated] = await db
    .update(schema.workflows)
    .set({
      name: input.name,
      description: input.description,
      graph,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date(),
    })
    .where(eq(schema.workflows.id, input.id))
    .returning({ id: schema.workflows.id });

  if (!updated) {
    throw new Error("Workflow not found");
  }

  return { ok: validation.ok, errors: validation.errors };
}

export async function exportWorkflow(id: string) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(schema.workflows)
    .where(and(eq(schema.workflows.id, id), eq(schema.workflows.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("Workflow not found");

  return {
    name: row.name,
    description: row.description,
    graph: row.graph as WorkflowGraph,
    schemaVersion: row.schemaVersion ?? CURRENT_SCHEMA_VERSION,
  };
}

export async function importWorkflow(data: {
  name: string;
  description?: string;
  graph: unknown;
  schemaVersion?: number;
}) {
  const user = await requireUser();

  const parsed = workflowGraphSchema.parse(data.graph);
  const { graph } = migrateGraph(parsed, data.schemaVersion ?? 1);

  const [inserted] = await db
    .insert(schema.workflows)
    .values({
      userId: user.id,
      name: data.name,
      slug: slugify(data.name),
      description: data.description ?? "",
      graph,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    })
    .returning({ id: schema.workflows.id });
  return inserted.id;
}

export async function createFromTemplate(slug: string) {
  const { TEMPLATES } = await import("./templates");
  const template = TEMPLATES.find((t) => t.slug === slug);
  if (!template) throw new Error("Template not found");
  const user = await requireUser();
  const workspaceId = await personalWorkspace(user.id);
  const [row] = await db
    .insert(schema.workflows)
    .values({
      userId: user.id,
      workspaceId,
      name: template.name,
      slug: slugify(template.name + "-" + Date.now()),
      description: template.description,
      graph: template.graph,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    })
    .returning({ id: schema.workflows.id });
  return row.id;
}

export async function generateWorkflow(description: string) {
  const user = await requireUser();
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8000";
  const res = await fetch(`${apiUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  const { graph } = await res.json();
  const parsed = workflowGraphSchema.safeParse(graph);
  if (!parsed.success || parsed.data.nodes.length === 0) {
    throw new Error("Could not generate a workflow. Try rephrasing, or build it manually.");
  }

  const workspaceId = await personalWorkspace(user.id);
  const [row] = await db
    .insert(schema.workflows)
    .values({
      userId: user.id,
      workspaceId,
      name: description.slice(0, 48),
      slug: slugify(description.slice(0, 32) + "-" + Date.now()),
      description,
      graph: parsed.data,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    })
    .returning({ id: schema.workflows.id });
  return row.id;
}

export async function deleteWorkflow(id: string) {
  const user = await requireUser();
  await db
    .delete(schema.workflows)
    .where(and(eq(schema.workflows.id, id), eq(schema.workflows.userId, user.id)));
}

export async function publishWorkflow(id: string) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(schema.workflows)
    .where(and(eq(schema.workflows.id, id), eq(schema.workflows.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("Workflow not found");

  const validation = validateGraph(row.graph as WorkflowGraph);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  await db
    .update(schema.workflows)
    .set({ publishedGraph: row.graph, publishedAt: new Date() })
    .where(eq(schema.workflows.id, id));
  return { ok: true, errors: [] };
}

export interface RunSummary {
  id: string;
  status: string;
  output: unknown;
  error: string | null;
  started_at: string | null;
  cost_usd: number | null;
}

export async function listRuns(workflowId: string): Promise<RunSummary[]> {
  const user = await requireUser();
  if (!(await requireWorkflowAccess(workflowId, user.id, "viewer"))) return [];
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/workflows/${workflowId}/runs`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as RunSummary[];
  } catch {
    return [];
  }
}
