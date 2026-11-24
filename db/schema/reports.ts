import { sql } from "drizzle-orm";
import { check, date, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./common";
import { profiles } from "./profiles";
import { sites } from "./sites";

export const REPORT_STATUSES = ["draft", "submitted", "reopened"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "restrict" }),
    status: text("status", { enum: REPORT_STATUSES }).notNull().default("draft"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    // submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    // One report per site per day. This also indexes "reports of a site by date".
    unique("reports_site_date_unique").on(t.siteId),
    index("reports_created_by_idx").on(t.createdBy),
    // A submitted report must record when it was submitted.
    check(
      "reports_submitted_at_check",
      sql`${t.status} <> 'submitted' OR ${t.createdAt} IS NOT NULL`,
    ),
  ],
);