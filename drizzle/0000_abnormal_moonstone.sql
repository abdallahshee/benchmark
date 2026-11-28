CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sites_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"status" text,
	"role" text,
	"site_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"id_number" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"trade" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workers_id_number_unique" UNIQUE("id_number"),
	CONSTRAINT "workers_first_name_check" CHECK (length(trim("workers"."first_name")) > 0),
	CONSTRAINT "workers_last_name_check" CHECK (length(trim("workers"."last_name")) > 0),
	CONSTRAINT "workers_phone_check" CHECK (length(trim("workers"."phone")) > 0),
	CONSTRAINT "workers_trade_check" CHECK (length(trim("workers"."trade")) > 0)
);
--> statement-breakpoint
CREATE TABLE "site_workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_workers_site_worker_unique" UNIQUE("site_id","worker_id")
);
--> statement-breakpoint
CREATE TABLE "report_workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"hours" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_workers_report_worker_unique" UNIQUE("report_id","worker_id"),
	CONSTRAINT "report_workers_hours_check" CHECK ("report_workers"."hours" >= 0 AND "report_workers"."hours" <= 24)
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machineries" ADD CONSTRAINT "machineries_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_workers" ADD CONSTRAINT "site_workers_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_workers" ADD CONSTRAINT "site_workers_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_workers" ADD CONSTRAINT "report_workers_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_workers" ADD CONSTRAINT "report_workers_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reports_site_date_unique" ON "reports" USING btree ("site_id",(("created_at" AT TIME ZONE 'Africa/Nairobi')::date));--> statement-breakpoint
CREATE INDEX "reports_created_by_idx" ON "reports" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "profiles_site_id_idx" ON "profiles" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_one_foreman_per_site" ON "profiles" USING btree ("site_id") WHERE "profiles"."role" = 'foreman';--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_one_secretary_per_site" ON "profiles" USING btree ("site_id") WHERE "profiles"."role" = 'secretary';--> statement-breakpoint
CREATE INDEX "materials_report_id_idx" ON "materials" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "machineries_report_id_idx" ON "machineries" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "workers_trade_idx" ON "workers" USING btree ("trade");--> statement-breakpoint
CREATE INDEX "site_workers_site_id_idx" ON "site_workers" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "site_workers_worker_id_idx" ON "site_workers" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "report_workers_report_id_idx" ON "report_workers" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_workers_worker_id_idx" ON "report_workers" USING btree ("worker_id");