CREATE TABLE "credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'api_key' NOT NULL,
	"ciphertext" text NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "published_graph" jsonb;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "mcp_key" text;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "mcp_inputs" jsonb;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credentials_user_slug_unique" ON "credentials" USING btree ("user_id","slug");