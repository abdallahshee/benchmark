

import { sql } from "drizzle-orm";

import {
  check,
  index,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";

export const workers = pgTable(
  "workers",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    idNumber: text("id_number").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    trade: text("trade").notNull(),

    ...timestamps,
  },
  (t) => [
    unique("workers_id_number_unique").on(t.idNumber),

    index("workers_trade_idx").on(t.trade),

    check(
      "workers_first_name_check",
      sql`length(trim(${t.firstName})) > 0`,
    ),

    check(
      "workers_last_name_check",
      sql`length(trim(${t.lastName})) > 0`,
    ),

    check(
      "workers_phone_check",
      sql`length(trim(${t.phone})) > 0`,
    ),

    check(
      "workers_trade_check",
      sql`length(trim(${t.trade})) > 0`,
    ),
  ],
);