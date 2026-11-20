import { ROLES } from "@/types/user";
import {  pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {  authUsers } from "drizzle-orm/supabase";





// One row per auth user, created automatically by the `on_auth_user_created` trigger
// (drizzle/0004_profiles_auth.sql).
//
// `role` is null until an admin assigns one: a user without a role can sign in but
// can't access anything. Only admins can change roles (enforced by RLS below and by
// requireRole() in Server Actions, since Drizzle itself bypasses RLS).
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    fullName: text("full_name"),
     role: text("role", { enum: ROLES }), // nullable until an admin assigns one
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [

  ],
)

export type Profile = typeof profiles.$inferSelect;
// export type User = StrictOmit<Profile, "id">;
export type CurrentUser = Omit<Profile & {
  email: string | undefined;
},"updatedAt">;
