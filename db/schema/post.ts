import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Example table — replace or extend with your own schema.
//
// RLS is enabled with no policies, so the Supabase Data API (publishable key) can't
// read or write this table. Drizzle connects as `postgres`, which bypasses RLS, so
// server code must scope queries to the signed-in user itself.
// Add pgPolicy() entries if you also want to query it via supabase-js.
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
