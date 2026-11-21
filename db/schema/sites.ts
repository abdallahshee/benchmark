import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./common";
import { SITE_STATUSES } from "@/types/enums";



export type SiteStatus = (typeof SITE_STATUSES)[number];

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    status: text("status", { enum: SITE_STATUSES }).notNull().default("active"),
    ...timestamps,
  },
  (t) => [

  ],
)