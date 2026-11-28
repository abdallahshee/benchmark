import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { machineries, materials, profiles, reports, reportWorkers, sites, siteWorkers } from "@/db/schema";

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




const sameMonth = sql`date_trunc('month', r.created_at at time zone ${TZ}) = date_trunc('month', now() at time zone ${TZ})`;

// Everything the secretary's "My site" page shows. This function does NOT check access:
// callers must call requireRole("secretary") first and pass the site from the signed-in
// user's profile, never from the browser.
export async function getSecretarySite(siteId: string) {
  const [siteRows, foremanRows, todayRows, [workerCount], monthRows, recent] = await Promise.all([
    db
      .select({ id: sites.id, name: sites.name, status: sites.status })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1),

    // A site has at most one foreman. Emails live in Supabase's auth.users.
    db
      .select({
        id: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        phone: profiles.phone,
        email: sql<string | null>`(select u.email from auth.users u where u.id = ${profiles}.id)`,
      })
      .from(profiles)
      .where(and(eq(profiles.siteId, siteId), eq(profiles.role, "foreman")))
      .limit(1),

    db
      .select({ id: reports.id, createdAt: reports.createdAt })
      .from(reports)
      .where(and(eq(reports.siteId, siteId), sql`${reportDay} = ${todayDate}`))
      .limit(1),

    db
      .select({ total: sql<number>`count(*)::int` })
      .from(siteWorkers)
      .where(eq(siteWorkers.siteId, siteId)),

    // This month's figures, as plain SQL so Postgres does the exact decimal math.
    db
      .select({
        reportCount: sql<number>`(
          select count(*)::int from ${reports} r where r.site_id = ${sites}.id and ${sameMonth}
        )`,
        workerHours: sql<string>`coalesce((
          select sum(rw.hours) from ${reportWorkers} rw
          join ${reports} r on r.id = rw.report_id
          where r.site_id = ${sites}.id and ${sameMonth}
        ), 0)`,
        machineHours: sql<string>`coalesce((
          select sum(c.number * c.hours) from ${machineries} c
          join ${reports} r on r.id = c.report_id
          where r.site_id = ${sites}.id and ${sameMonth}
        ), 0)`,
        materialsCost: sql<string>`coalesce((
          select sum(m.quantity * m.unit_cost) from ${materials} m
          join ${reports} r on r.id = m.report_id
          where r.site_id = ${sites}.id and ${sameMonth}
        ), 0)`,
      })
      .from(sites)
      .where(eq(sites.id, siteId)),

    db
      .select({
        id: reports.id,
        createdAt: reports.createdAt,
        creatorFirstName: profiles.firstName,
        creatorLastName: profiles.lastName,
      })
      .from(reports)
      .leftJoin(profiles, eq(profiles.id, reports.createdBy))
      .where(eq(reports.siteId, siteId))
      .orderBy(desc(reports.createdAt), desc(reports.id))
      .limit(5),
  ]);

  return {
    site: siteRows[0] ?? null,
    foreman: foremanRows[0] ?? null,
    today: todayRows[0] ?? null,
    workerCount: workerCount?.total ?? 0,
    month: monthRows[0] ?? { reportCount: 0, workerHours: "0", machineHours: "0", materialsCost: "0" },
    recent,
  };
}

export type SecretarySite = Awaited<ReturnType<typeof getSecretarySite>>;