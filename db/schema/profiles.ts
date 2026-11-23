import {  index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import {  authUsers } from "drizzle-orm/supabase";
import { timestamps } from "./common";
import { ROLES } from "@/types/enums";





// One row per auth user, created automatically by the `on_auth_user_created` trigger
// (drizzle/0004_profiles_auth.sql).
//
// `role` is null until an admin assigns one: a user without a role can sign in but
// can't access anything. Only admins can change roles (enforced by RLS below and by
// requireRole() in Server Actions, since Drizzle itself bypasses RLS).

import { sites } from "./sites";
import { sql } from "drizzle-orm";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    role: text("role", { enum: ROLES }), // nullable until an admin assigns one
    // The engineer (admin) has no site. Foremen and secretaries belong to one.
    siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
    ...timestamps
  },
  (t) => [
    index("profiles_site_id_idx").on(t.siteId),
    // A site has many users, but at most one foreman and one secretary.
    uniqueIndex("profiles_one_foreman_per_site")
      .on(t.siteId)
      .where(sql`${t.role} = 'foreman'`),
    uniqueIndex("profiles_one_secretary_per_site")
      .on(t.siteId)
      .where(sql`${t.role} = 'secretary'`),
  ],
);


export type Profile = typeof profiles.$inferSelect;
// export type User = StrictOmit<Profile, "id">;
export type CurrentUser = Omit<Profile, "updatedAt" | "createdAt"> & {
  email: string | undefined;
};
