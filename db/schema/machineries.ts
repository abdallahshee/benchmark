import { sql } from "drizzle-orm";
import { check, index, integer, numeric, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./common";
import { reports } from "./reports";

export const machineries = pgTable(
  "machineries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    category: text("category").notNull(), // for example "excavator", "roller"
    number: integer("number").notNull(), // machines of this category in operation
    hours: numeric("hours", { precision: 5, scale: 2 }).notNull(), // hours worked
    ...timestamps,
  },
  (t) => [
    index("machineries_report_id_idx").on(t.reportId),
    // One line per category per report: change the number, don't repeat the category.
    unique("machineries_report_category_unique").on(t.reportId, t.category),
    check("machineries_number_check", sql`${t.number} >= 0`),
    check("machineries_hours_check", sql`${t.hours} >= 0`),
  ],
).enableRLS();