import {
  pgTable,
  text,
  uuid,
  jsonb,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const runStatusEnum = pgEnum("run_status", [
  "pending",
  "running",
  "paused",
  "done",
  "error",
]);

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
]);

export const runEventTypeEnum = pgEnum("run_event_type", [
  "node_start",
  "node_finish",
  "node_error",
  "run_status",
  "interrupt",
  "approved",
  "denied",
  "log",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  personal: boolean("personal").notNull().default(false),
  monthlyBudgetUsd: numeric("monthly_budget_usd", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("editor"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("memberships_ws_user_unique").on(t.workspaceId, t.userId)],
);

export const workflowPermissions = pgTable(
  "workflow_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("viewer"),
  },
  (t) => [uniqueIndex("workflow_perms_unique").on(t.workflowId, t.userId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("comments_workflow_idx").on(t.workflowId)],
);

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    graph: jsonb("graph").notNull().default({ nodes: [], edges: [] }),
    publishedGraph: jsonb("published_graph"),
    publishedAt: timestamp("published_at"),
    mcpKey: text("mcp_key"),
    mcpInputs: jsonb("mcp_inputs"),
    isPublic: boolean("is_public").notNull().default(false),
    sourceWorkflowId: uuid("source_workflow_id"),
    schemaVersion: integer("schema_version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("workflows_user_slug_unique").on(t.userId, t.slug)],
);

export const credentials = pgTable(
  "credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: text("type").notNull().default("api_key"),
    ciphertext: text("ciphertext").notNull(),
    scope: text("scope").notNull().default("personal"),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("credentials_user_slug_unique").on(t.userId, t.slug)],
);

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    status: runStatusEnum("status").notNull().default("pending"),
    input: jsonb("input"),
    output: jsonb("output"),
    error: text("error"),
    idempotencyKey: text("idempotency_key"),
    costUsd: numeric("cost_usd", { precision: 12, scale: 6 }),
    tokensTotal: integer("tokens_total"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    finishedAt: timestamp("finished_at"),
  },
  (t) => [
    index("runs_workflow_idx").on(t.workflowId),
    uniqueIndex("runs_idempotency_unique").on(t.workflowId, t.idempotencyKey),
  ],
);

export const runEvents = pgTable(
  "run_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    nodeId: text("node_id").notNull(),
    type: runEventTypeEnum("type").notNull(),
    payload: jsonb("payload"),
    durationMs: integer("duration_ms"),
    costUsd: numeric("cost_usd", { precision: 12, scale: 6 }),
    tokens: integer("tokens"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("run_events_run_idx").on(t.runId)],
);

export const failedRuns = pgTable(
  "failed_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    nodeId: text("node_id").notNull(),
    error: text("error").notNull(),
    retryCount: integer("retry_count").notNull().default(0),
    state: jsonb("state"),
    resolved: boolean("resolved").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("failed_runs_workflow_idx").on(t.workflowId)],
);

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    namespace: text("namespace").notNull(),
    content: text("content").notNull(),
    embedding: text("embedding"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("memories_ns_idx").on(t.userId, t.namespace)],
);

export const triggers = pgTable(
  "triggers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    cron: text("cron"),
    webhookSecret: text("webhook_secret"),
    enabled: boolean("enabled").notNull().default(true),
    lastFiredAt: timestamp("last_fired_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("triggers_workflow_idx").on(t.workflowId)],
);

export const mcpToolInvocations = pgTable(
  "mcp_tool_invocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    status: text("status").notNull(),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("mcp_invocations_workflow_idx").on(t.workflowId)],
);

export const nodeOutputCache = pgTable(
  "node_output_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cacheKey: text("cache_key").notNull().unique(),
    output: jsonb("output").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("node_output_cache_expiry_idx").on(t.expiresAt)],
);
