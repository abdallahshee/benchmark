import { db } from "@/db";
import { profiles, reports, sites } from "@/db/schema";
import { isUuid, TZ } from "@/lib/helper";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { cache } from "react";


// A malformed id would make Postgres throw, so every function treats it as "not found".
// const isUuid = (value: string) => UUID_RE.test(value);

// "Today" depends on the time zone. Change this if your sites are elsewhere.


// None of these functions check access: callers must call requireRole() first.

// The site, its users and a few counts. Returns null if the id is malformed or unknown.
export const getSiteById = cache(async (id: string) => {
  if (!isUuid(id)) return null;

  const [siteRows, users] = await Promise.all([
    db
      .select({
        id: sites.id,
        name: sites.name,
        status: sites.status,
        createdAt: sites.createdAt,
        reportCount: sql<number>`(
          select count(*)::int from ${reports} r where r.site_id = ${sites}.id
        )`,
        hasTodayReport: sql<boolean>`exists (
          select 1 from ${reports} r
          where r.site_id = ${sites}.id
            and (r.created_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date
        )`,
      })
      .from(sites)
      .where(eq(sites.id, id))
      .limit(1),

    db
      .select({
        id: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        role: profiles.role,
        // Emails live in Supabase's auth.users, so read them with a subquery.
        email: sql<string | null>`(select u.email from auth.users u where u.id = ${profiles}.id)`,
      })
      .from(profiles)
      .where(eq(profiles.siteId, id))
      .orderBy(asc(profiles.firstName), asc(profiles.lastName)),
  ]);

  const site = siteRows[0];
  return site ? { ...site, users } : null;
});

// The foreman of a site, or null if none is assigned. A site has at most one foreman.
export const getForemanBySiteId = cache(async (siteId: string) => {
  if (!isUuid(siteId)) return null;

  const [foreman] = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
      email: sql<string | null>`(select u.email from auth.users u where u.id = ${profiles}.id)`,
    })
    .from(profiles)
    .where(and(eq(profiles.siteId, siteId), eq(profiles.role, "foreman")))
    .limit(1);

  return foreman ?? null;
});

// The reports of a site, latest first: by report date, then by creation time.

export const getReportsBySiteId = cache(async (siteId: string, limit = 50) => {
  if (!isUuid(siteId)) return []; // a malformed id would make Postgres throw

  return db
    .select({ id: reports.id, createdAt: reports.createdAt })
    .from(reports)
    .where(eq(reports.siteId, siteId))
    // The id keeps the order stable if two reports share a timestamp.
    .orderBy(desc(reports.createdAt), desc(reports.id))
    .limit(limit);
});

export type SiteDetails = NonNullable<Awaited<ReturnType<typeof getSiteById>>>;
export type SiteForeman = NonNullable<Awaited<ReturnType<typeof getForemanBySiteId>>>;
export type SiteReport = Awaited<ReturnType<typeof getReportsBySiteId>>[number];