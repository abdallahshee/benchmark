ALTER TABLE "reports" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "materials" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "machineries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "reports_created_by_idx" ON "reports" USING btree ("created_by");--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_submitted_at_check" CHECK ("reports"."status" <> 'submitted' OR "reports"."submitted_at" IS NOT NULL);