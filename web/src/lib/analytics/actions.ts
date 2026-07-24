"use server";

import { sql, eq, gte, and, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";

function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getAnalytics() {
  const user = await requireUser();
  const since = monthStart();

  const totals = await db
    .select({
      runs: sql<number>`count(*)`,
      cost: sql<number>`coalesce(sum(${schema.runs.costUsd}), 0)`,
    })
    .from(schema.runs)
    .where(and(eq(schema.runs.userId, user.id), gte(schema.runs.startedAt, since)));

  const perWorkflow = await db
    .select({
      name: schema.workflows.name,
      runs: sql<number>`count(${schema.runs.id})`,
      cost: sql<number>`coalesce(sum(${schema.runs.costUsd}), 0)`,
    })
    .from(schema.runs)
    .innerJoin(schema.workflows, eq(schema.runs.workflowId, schema.workflows.id))
    .where(and(eq(schema.runs.userId, user.id), gte(schema.runs.startedAt, since)))
    .groupBy(schema.workflows.name)
    .orderBy(desc(sql`sum(${schema.runs.costUsd})`))
    .limit(10);

  return {
    totalRuns: Number(totals[0]?.runs ?? 0),
    totalCost: Number(totals[0]?.cost ?? 0),
    perWorkflow: perWorkflow.map((w) => ({
      name: w.name,
      runs: Number(w.runs),
      cost: Number(w.cost),
    })),
  };
}
