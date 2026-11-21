import { sql } from "drizzle-orm";
import { check, index, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./common";
import { reports } from "./reports";

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // for example "Cement"
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
    unit: text("unit").notNull(), // for example "bags", "tonnes", "m3"
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
    ...timestamps,
  },
  (t) => [
    index("materials_report_id_idx").on(t.reportId),
    check("materials_quantity_check", sql`${t.quantity} >= 0`),
    check("materials_unit_cost_check", sql`${t.unitCost} >= 0`),
  ],
).enableRLS();