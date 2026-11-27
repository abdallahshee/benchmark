import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { profiles, reports, sites } from "@/db/schema";

// "Today" depends on the time zone. Change this if your sites are elsewhere.
const TZ = sql.raw("'Africa/Nairobi'");

// A report has no date column: its day is the day it was created, in the site's time zone.
const reportDay = sql`((${reports.createdAt} at time zone ${TZ})::date)`;
const todayDate = sql`((now() at time zone ${TZ})::date)`;

// Everything the secretary's dashboard shows for one site. This function does NOT check
// access: callers must call requireRole("secretary") first and pass the site from the
// signed-in user's profile, never from the browser.
export async function getSecretaryDashboard(siteId: string) {
  const [siteRows, todayRows, [stats], recent] = await Promise.all([
    db.select({ id: sites.id, name: sites.name }).from(sites).where(eq(sites.id, siteId)).limit(1),

    // The report created today, if there is one. A site has one report per day.
    db
      .select({ id: reports.id, createdAt: reports.createdAt })
      .from(reports)
      .where(and(eq(reports.siteId, siteId), sql`${reportDay} = ${todayDate}`))
      .limit(1),

    db
      .select({
        total: count(),
        thisMonth: sql<number>`count(*) filter (
          where date_trunc('month', ${reports.createdAt} at time zone ${TZ})
              = date_trunc('month', now() at time zone ${TZ})
        )::int`,
      })
      .from(reports)
      .where(eq(reports.siteId, siteId)),

    db
      .select({
        id: reports.id,
        createdAt: reports.createdAt,
        creatorFirstName: profiles.firstName,
        creatorLastName: profiles.lastName,
        // Plain SQL so Postgres does the exact decimal math.
        materialsCost: sql<string>`coalesce(
          (select sum(m.quantity * m.unit_cost) from materials m where m.report_id = ${reports}.id), 0
        )`,
      })
      .from(reports)
      .leftJoin(profiles, eq(profiles.id, reports.createdBy))
      .where(eq(reports.siteId, siteId))
      .orderBy(desc(reports.createdAt), desc(reports.id))
      .limit(5),
  ]);

  return {
    site: siteRows[0] ?? null,
    today: todayRows[0] ?? null,
    total: stats.total,
    thisMonth: stats.thisMonth,
    recent,
  };
}

export type SecretaryDashboard = Awaited<ReturnType<typeof getSecretaryDashboard>>;