"use server";

import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { requireWorkflowAccess } from "./rbac";

export async function listComments(workflowId: string) {
  const user = await requireUser();
  if (!(await requireWorkflowAccess(workflowId, user.id, "viewer"))) return [];
  return db
    .select({
      id: schema.comments.id,
      body: schema.comments.body,
      userId: schema.comments.userId,
      createdAt: schema.comments.createdAt,
    })
    .from(schema.comments)
    .where(eq(schema.comments.workflowId, workflowId))
    .orderBy(desc(schema.comments.createdAt));
}

export async function addComment(workflowId: string, body: string) {
  const user = await requireUser();
  if (!(await requireWorkflowAccess(workflowId, user.id, "viewer"))) {
    throw new Error("Not authorized");
  }
  await db.insert(schema.comments).values({
    workflowId,
    userId: user.id,
    body: body.slice(0, 2000),
  });
}
