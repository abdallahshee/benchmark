ALTER TABLE "reports" DROP CONSTRAINT "reports_submitted_at_check";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "submitted_at";--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_submitted_at_check" CHECK ("reports"."status" <> 'submitted' OR "reports"."created_at" IS NOT NULL);