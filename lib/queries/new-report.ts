import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { reports, siteWorkers, sites, workers } from "@/db/schema";

// "Today" depends on the time zone. Keep it in sync with the unique index on reports.
const TZ = sql.raw("'Africa/Nairobi'");
const reportDay = sql`((${reports.createdAt} at time zone ${TZ})::date)`;
const todayDate = sql`((now() at time zone ${TZ})::date)`;

// Everything the new-report page needs for one site: the site, today's report if one already
// exists, and the workers registered on the site. This function does NOT check access:
// callers must call requireRole("foreman") first and pass the site from the signed-in user's
// profile, never from the browser.
export async function getNewReportContext(siteId: string) {
  const [siteRows, todayRows, siteWorkerRows] = await Promise.all([
    db
      .select({ id: sites.id, name: sites.name, status: sites.status })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1),

    db
      .select({ id: reports.id })
      .from(reports)
      .where(and(eq(reports.siteId, siteId), sql`${reportDay} = ${todayDate}`))
      .limit(1),

    db
      .select({
        id: workers.id,
        firstName: workers.firstName,
        lastName: workers.lastName,
        trade: workers.trade,
      })
      .from(siteWorkers)
      .innerJoin(workers, eq(workers.id, siteWorkers.workerId))
      .where(eq(siteWorkers.siteId, siteId))
      .orderBy(asc(workers.trade), asc(workers.firstName), asc(workers.lastName)),
  ]);

  return {
    site: siteRows[0] ?? null,
    today: todayRows[0] ?? null,
    workers: siteWorkerRows,
  };
}