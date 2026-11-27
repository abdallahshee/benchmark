import { sql } from "drizzle-orm";
import {
    check,
    index,
    numeric,
    pgTable,
    unique,
    uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { reports } from "./reports";
import { workers } from "./workers";

export const reportWorkers = pgTable(
    "report_workers",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        reportId: uuid("report_id")
            .notNull()
            .references(() => reports.id, { onDelete: "cascade" }),
        workerId: uuid("worker_id")
            .notNull()
            .references(() => workers.id, { onDelete: "restrict" }),
        hours: numeric("hours", {
            precision: 5,
            scale: 2,
        }).notNull(),

        ...timestamps,
    },
    (table) => [
        index("report_workers_report_id_idx").on(table.reportId),

        index("report_workers_worker_id_idx").on(table.workerId),

        unique("report_workers_report_worker_unique").on(
            table.reportId,
            table.workerId,
        ),

        check(
            "report_workers_hours_check",
            sql`${table.hours} >= 0 AND ${table.hours} <= 24`,
        ),
    ],
);