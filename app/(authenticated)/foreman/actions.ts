import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { reports, sites } from "@/db/schema";

// "Today" depends on the time zone. Change this if your sites are elsewhere.
const TZ = sql.raw("'Africa/Nairobi'");

// None of these functions check access: callers must call requireRole("foreman") first,
// and must pass the site from the signed-in user's profile, never from the browser.

export const getSiteSummary = cache(async (siteId: string) => {
  const [site] = await db
    .select({ id: sites.id, name: sites.name, status: sites.status })
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1);
  return site ?? null;
});

export async function getForemanDashboard(siteId: string) {
  const [site, todayRows, statusRows, recent] = await Promise.all([
    getSiteSummary(siteId),

    // The report for today's date, if one exists. One report per site per day.
    db
      .select({
        id: reports.id,
        status: reports.status,
        notes: reports.notes,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .where(
        and(
          eq(reports.siteId, siteId),
          sql`${reports.createdAt} = (now() at time zone ${TZ})::date`,
        ),
      )
      .limit(1),

    db
      .select({ status: reports.status, total: count() })
      .from(reports)
      .where(eq(reports.siteId, siteId))
      .groupBy(reports.status),

    db
      .select({
        id: reports.id,
        reportDate: reports.createdAt,
        status: reports.status,
        notes:reports.notes,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .where(eq(reports.siteId, siteId))
      .orderBy(desc(reports.createdAt), desc(reports.createdAt))
      .limit(5),
  ]);

  const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
  for (const row of statusRows) {
    if (row.status in counts) counts[row.status as keyof typeof counts] = row.total;
  }

  return { site, today: todayRows[0] ?? null, counts, recent };
}

export type ForemanDashboard = Awaited<ReturnType<typeof getForemanDashboard>>;