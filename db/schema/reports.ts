import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { profiles } from "./profiles";
import { sites } from "./sites";
// import { REPORT_STATUSES } from "@/types/enums";

// export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "restrict" }),

    notes: text("notes"),

    createdBy: uuid("created_by")
      .references(() => profiles.id, { onDelete: "set null" }),

    ...timestamps,
  },
  (t) => [
    uniqueIndex("reports_site_date_unique").on(
      t.siteId,
      sql`((${t.createdAt} AT TIME ZONE 'Africa/Nairobi')::date)`,
    ),

    index("reports_created_by_idx").on(t.createdBy),

  ],
);