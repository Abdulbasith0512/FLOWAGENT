CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "workspace_role" DEFAULT 'editor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "workspace_role" DEFAULT 'viewer' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" text NOT NULL,
	"personal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "scope" text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_permissions" ADD CONSTRAINT "workflow_permissions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_permissions" ADD CONSTRAINT "workflow_permissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_workflow_idx" ON "comments" USING btree ("workflow_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_ws_user_unique" ON "memberships" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_perms_unique" ON "workflow_permissions" USING btree ("workflow_id","user_id");--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
-- backfill: one personal workspace per user, membership as owner, assign existing rows
INSERT INTO "workspaces" ("id", "name", "slug", "owner_id", "personal", "created_at")
SELECT gen_random_uuid(), 'Personal', 'personal-' || u."id", u."id", true, now()
FROM "user" u
WHERE NOT EXISTS (
  SELECT 1 FROM "workspaces" w WHERE w."owner_id" = u."id" AND w."personal" = true
);

INSERT INTO "memberships" ("id", "workspace_id", "user_id", "role", "created_at")
SELECT gen_random_uuid(), w."id", w."owner_id", 'owner', now()
FROM "workspaces" w
WHERE w."personal" = true
  AND NOT EXISTS (
    SELECT 1 FROM "memberships" m WHERE m."workspace_id" = w."id" AND m."user_id" = w."owner_id"
  );

UPDATE "workflows" wf
SET "workspace_id" = w."id"
FROM "workspaces" w
WHERE w."owner_id" = wf."user_id" AND w."personal" = true AND wf."workspace_id" IS NULL;

UPDATE "runs" r
SET "workspace_id" = w."id"
FROM "workspaces" w
WHERE w."owner_id" = r."user_id" AND w."personal" = true AND r."workspace_id" IS NULL;

UPDATE "credentials" c
SET "workspace_id" = w."id"
FROM "workspaces" w
WHERE w."owner_id" = c."user_id" AND w."personal" = true AND c."workspace_id" IS NULL;
