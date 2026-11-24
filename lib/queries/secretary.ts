import "server-only";

import { and, asc, count, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { profiles, reports } from "@/db/schema";
import { getSiteSummary } from "@/app/(authenticated)/foreman/actions";

// "Today" depends on the time zone. Change this if your sites are elsewhere.
const TZ = sql.raw("'Africa/Nairobi'");

const PENDING_SHOWN = 10;

// This function does NOT check access: callers must call requireRole("secretary") first
// and pass the site from the signed-in user's profile, never from the browser. Drafts are
// private to the foreman, so every query here leaves them out.
export async function getSecretaryDashboard(siteId: string) {
  const [site, todayRows, statusRows, pending] = await Promise.all([
    getSiteSummary(siteId),

    // The report for today's date, if the foreman has sent one. One report per site per day.
    db
      .select({ id: reports.id, status: reports.status, createdAt: reports.createdAt })
      .from(reports)
      .where(
        and(
          eq(reports.siteId, siteId),
          ne(reports.status, "draft"),
          sql`${reports.createdAt} = (now() at time zone ${TZ})::date`,
        ),
      )
      .limit(1),

    db
      .select({ status: reports.status, total: count() })
      .from(reports)
      .where(and(eq(reports.siteId, siteId), ne(reports.status, "draft")))
      .groupBy(reports.status),

    // The review queue: the report that has waited longest comes first.
    db
      .select({
        id: reports.id,
        createdAt: reports.createdAt,
        // submittedAt: reports.submittedAt,
        creatorFirstName: profiles.firstName,
        creatorLastName: profiles.lastName,
        // Plain SQL so Postgres does the exact decimal math.
        materialsCost: sql<string>`coalesce(
          (select sum(m.quantity * m.unit_cost) from materials m where m.report_id = ${reports}.id), 0
        )`,
      })
      .from(reports)
      .leftJoin(profiles, eq(profiles.id, reports.createdBy))
      .where(and(eq(reports.siteId, siteId), eq(reports.status, "draft")))
      .orderBy(asc(reports.createdAt))
      .limit(PENDING_SHOWN),
  ]);

  const counts = { draft: 0, approved: 0, rejected: 0 };
  for (const row of statusRows) {
    if (row.status in counts) counts[row.status as keyof typeof counts] = row.total;
  }

  return { site, today: todayRows[0] ?? null, counts, pending };
}

export type SecretaryDashboard = Awaited<ReturnType<typeof getSecretaryDashboard>>;
export const SECRETARY_PENDING_SHOWN = PENDING_SHOWN;