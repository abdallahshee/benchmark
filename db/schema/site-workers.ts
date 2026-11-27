import { index, pgTable, unique, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { sites } from "./sites";
import { workers } from "./workers";

export const siteWorkers = pgTable(
  "site_workers",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),

    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    ...timestamps,
  },
  (table) => [
    index("site_workers_site_id_idx").on(table.siteId),
    index("site_workers_worker_id_idx").on(table.workerId),

    unique("site_workers_site_worker_unique").on(
      table.siteId,
      table.workerId,
    ),
  ],
);