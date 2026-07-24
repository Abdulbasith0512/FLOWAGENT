ALTER TABLE "workflows" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "source_workflow_id" uuid;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "monthly_budget_usd" numeric(12, 2);