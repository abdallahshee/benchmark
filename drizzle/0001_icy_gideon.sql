CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_site_date_unique" UNIQUE("site_id")
);
--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machineries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"category" text NOT NULL,
	"number" integer NOT NULL,
	"hours" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "machineries_report_category_unique" UNIQUE("report_id","category"),
	CONSTRAINT "machineries_number_check" CHECK ("machineries"."number" >= 0),
	CONSTRAINT "machineries_hours_check" CHECK ("machineries"."hours" >= 0)
);
--> statement-breakpoint
ALTER TABLE "machineries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"unit" text NOT NULL,
	"unit_cost" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materials_quantity_check" CHECK ("materials"."quantity" >= 0),
	CONSTRAINT "materials_unit_cost_check" CHECK ("materials"."unit_cost" >= 0)
);
--> statement-breakpoint
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "posts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "posts" CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "site_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machineries" ADD CONSTRAINT "machineries_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "machineries_report_id_idx" ON "machineries" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "materials_report_id_idx" ON "materials" USING btree ("report_id");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_site_id_idx" ON "profiles" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_one_foreman_per_site" ON "profiles" USING btree ("site_id") WHERE "profiles"."role" = 'foreman';--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_one_secretary_per_site" ON "profiles" USING btree ("site_id") WHERE "profiles"."role" = 'secretary';