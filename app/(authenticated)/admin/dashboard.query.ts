import "server-only";

import { asc, count, desc, eq, isNull, ne, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { profiles, reports, sites } from "@/db/schema";

// "Today" depends on the time zone. Change this if your sites are elsewhere.
const TZ = sql.raw("'Africa/Nairobi'");

const LATEST_REPORTS = 8;
const ROLELESS_SHOWN = 5;

// Everyone except admins. Users with no role yet are kept, because a null role never
// satisfies `role <> 'admin'` on its own.
const notAdmin = or(isNull(profiles.role), ne(profiles.role, "admin"));

// Everything the admin dashboard shows. This function does NOT check access: callers
// must call requireRole() first.
export async function getDashboardData() {
  // Written as plain SQL (alias.column, "sites".id) so Drizzle can't drop the table
  // prefix inside the subqueries of a single-table select.
  const reportedToday = sql<boolean>`exists (
    select 1 from ${reports} r
    where r.site_id = ${sites}.id
      and (r.created_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date
  )`;
  const hasForeman = sql<boolean>`exists (
    select 1 from ${profiles} p where p.site_id = ${sites}.id and p.role = 'foreman'
  )`;
  const hasSecretary = sql<boolean>`exists (
    select 1 from ${profiles} p where p.site_id = ${sites}.id and p.role = 'secretary'
  )`;

  const [
    [{ siteCount }],
    [{ reportCount }],
    [{ userCount }],
    activeSites,
    latestReports,
    usersWithoutRole,
    [{ usersWithoutRoleCount }],
  ] = await Promise.all([
    db.select({ siteCount: count() }).from(sites),
    db.select({ reportCount: count() }).from(reports),
    db.select({ userCount: count() }).from(profiles).where(notAdmin),

    // One pass over the active sites answers three questions: who reported today, who
    // has no foreman and who has no secretary.
    db
      .select({ id: sites.id, name: sites.name, reportedToday, hasForeman, hasSecretary })
      .from(sites)
      .where(eq(sites.status, "active"))
      .orderBy(asc(sites.name)),

    db
      .select({
        id: reports.id,
        status: reports.status,
        createdAt: reports.createdAt,
        siteName: sites.name,
        creatorFirstName: profiles.firstName,
        creatorLastName: profiles.lastName,
      })
      .from(reports)
      .innerJoin(sites, eq(sites.id, reports.siteId))
      .leftJoin(profiles, eq(profiles.id, reports.createdBy))
      .orderBy(desc(reports.createdAt))
      .limit(LATEST_REPORTS),

    db
      .select({
        id: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: sql<string | null>`(select u.email from auth.users u where u.id = ${profiles}.id)`,
      })
      .from(profiles)
      .where(isNull(profiles.role))
      .orderBy(desc(profiles.createdAt))
      .limit(ROLELESS_SHOWN),

    db.select({ usersWithoutRoleCount: count() }).from(profiles).where(isNull(profiles.role)),
  ]);

  const notReported = activeSites.filter((s) => !s.reportedToday).map(({ id, name }) => ({ id, name }));

  const sitesMissingStaff = activeSites
    .filter((s) => !s.hasForeman || !s.hasSecretary)
    .map((s) => ({
      id: s.id,
      name: s.name,
      missingForeman: !s.hasForeman,
      missingSecretary: !s.hasSecretary,
    }));

  return {
    siteCount,
    reportCount,
    userCount,
    today: {
      activeSiteCount: activeSites.length,
      reportedCount: activeSites.length - notReported.length,
      notReported,
    },
    latestReports,
    setup: { sitesMissingStaff, usersWithoutRole, usersWithoutRoleCount },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;