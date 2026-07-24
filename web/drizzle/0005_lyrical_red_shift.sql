CREATE TABLE "mcp_tool_invocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"tool_name" text NOT NULL,
	"status" text NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mcp_tool_invocations" ADD CONSTRAINT "mcp_tool_invocations_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mcp_invocations_workflow_idx" ON "mcp_tool_invocations" USING btree ("workflow_id");