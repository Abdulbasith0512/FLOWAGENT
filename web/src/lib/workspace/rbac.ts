import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db";

export type Role = "owner" | "admin" | "editor" | "viewer";

const RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

export function roleAllows(role: Role, required: Role): boolean {
  return RANK[role] >= RANK[required];
}

export async function personalWorkspace(userId: string): Promise<string> {
  const [existing] = await db
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .where(
      and(
        eq(schema.workspaces.ownerId, userId),
        eq(schema.workspaces.personal, true),
      ),
    )
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(schema.workspaces)
    .values({
      name: "Personal",
      slug: `personal-${userId}`,
      ownerId: userId,
      personal: true,
    })
    .returning({ id: schema.workspaces.id });

  await db.insert(schema.memberships).values({
    workspaceId: created.id,
    userId,
    role: "owner",
  });

  return created.id;
}

export async function workspaceRole(
  workspaceId: string,
  userId: string,
): Promise<Role | null> {
  const [membership] = await db
    .select({ role: schema.memberships.role })
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.workspaceId, workspaceId),
        eq(schema.memberships.userId, userId),
      ),
    )
    .limit(1);
  return (membership?.role as Role) ?? null;
}

export async function requireWorkflowAccess(
  workflowId: string,
  userId: string,
  required: Role,
): Promise<boolean> {
  const [workflow] = await db
    .select({
      workspaceId: schema.workflows.workspaceId,
      userId: schema.workflows.userId,
    })
    .from(schema.workflows)
    .where(eq(schema.workflows.id, workflowId))
    .limit(1);
  if (!workflow) return false;
  if (workflow.userId === userId) return true;

  const [perm] = await db
    .select({ role: schema.workflowPermissions.role })
    .from(schema.workflowPermissions)
    .where(
      and(
        eq(schema.workflowPermissions.workflowId, workflowId),
        eq(schema.workflowPermissions.userId, userId),
      ),
    )
    .limit(1);
  if (perm && roleAllows(perm.role as Role, required)) return true;

  if (workflow.workspaceId) {
    const role = await workspaceRole(workflow.workspaceId, userId);
    if (role && roleAllows(role, required)) return true;
  }
  return false;
}
