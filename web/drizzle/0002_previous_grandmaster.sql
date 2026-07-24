CREATE TABLE "failed_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"error" text NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"state" jsonb,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_output_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"output" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "node_output_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
ALTER TABLE "run_events" ADD COLUMN "cost_usd" numeric(12, 6);--> statement-breakpoint
ALTER TABLE "run_events" ADD COLUMN "tokens" integer;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "cost_usd" numeric(12, 6);--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "tokens_total" integer;--> statement-breakpoint
ALTER TABLE "failed_runs" ADD CONSTRAINT "failed_runs_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failed_runs" ADD CONSTRAINT "failed_runs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "failed_runs_workflow_idx" ON "failed_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "node_output_cache_expiry_idx" ON "node_output_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "runs_idempotency_unique" ON "runs" USING btree ("workflow_id","idempotency_key");