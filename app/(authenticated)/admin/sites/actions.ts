"use server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { profiles, reports, sites } from "@/db/schema";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";

const createSiteSchema = z.object({
  name: z.string().trim().min(1, "Enter a site name").max(100, "Use 100 characters or fewer"),
});

export type CreateSiteResult = { ok: true } | { ok: false; error: string };

export async function createSite(input: { name: string }): Promise<CreateSiteResult> {
  

  // Don't trust the argument's shape.
  const parsed = createSiteSchema.safeParse({ name: String(input?.name ?? "") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid site name" };
  }

  // The unique rule on name does the duplicate check, so no race between check and insert.
  const created = await db
    .insert(sites)
    .values({ name: parsed.data.name })
    .onConflictDoNothing({ target: sites.name })
    .returning({ id: sites.id });

  if (created.length === 0) {
    return { ok: false, error: "A site with this name already exists" };
  }

  revalidatePath("/admin/sites");
  revalidatePath("/admin"); // the dashboard shows the site count
  return { ok: true };
}

// "Today" depends on the time zone. Change this if your sites are elsewhere.
const TZ = sql.raw("'Africa/Nairobi'");

// When the site's first report of today was created, as epoch milliseconds, or null.
const todayReportAt = sql<number | null>`(
  select (extract(epoch from min(r.created_at)) * 1000)::double precision
  from ${reports} r
  where r.site_id = ${sites}.id
    and (r.created_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date
)`;

// All sites with their user count and the time of today's first report. Sites that
// reported today come first, earliest report at the top, then the rest by name.
// This function does NOT check access: callers must call requireRole() first.
export async function getSites() {
  return db
    .select({
      id: sites.id,
      name: sites.name,
      status: sites.status,
      userCount: sql<number>`(
        select count(*)::int from ${profiles} p where p.site_id = ${sites}.id
      )`,
      todayReportAt,
    })
    .from(sites)
    .orderBy(sql`${todayReportAt} asc nulls last`, asc(sites.name));
}

export type SiteListItem = Awaited<ReturnType<typeof getSites>>[number];

