import "server-only";


import { cache } from "react";
// import "server-only";

import { and, asc, count, desc, eq, max, sql } from "drizzle-orm";

import { db } from "@/db";
import { reportWorkers, reports, siteWorkers, sites, workers } from "@/db/schema";
import { isUuid } from "./helper";
// import { count } from "console";



export const getWorkersBySiteId = cache(async (siteId: string) => {
  if (!isUuid(siteId)) return [];

  return db
    .select({
      id: workers.id,
      firstName: workers.firstName,
      lastName: workers.lastName,
      idNumber: workers.idNumber,
      phone: workers.phone,
      email: workers.email,
      trade: workers.trade,
      assignedAt: siteWorkers.createdAt,
    })
    .from(siteWorkers)
    .innerJoin(workers, eq(siteWorkers.workerId, workers.id))
    .where(eq(siteWorkers.siteId, siteId))
    .orderBy(asc( asc(workers.trade)),workers.createdAt);
});

// import { isUuid } from "@/lib/is-uuid"; // use the path your isUuid lives at

type Options = {
  workerId: string;
  // For the foreman and secretary: their own site, taken from their profile. The worker
  // must be registered on it, and attendance only counts reports from it. Leave it out
  // only for the admin, who sees every site.
  siteId?: string;
  // The ID number is sensitive, so only roles that keep the registry get it.
  includeIdNumber?: boolean;
};

// One worker with their sites and attendance. Returns null when the id is malformed, the
// worker doesn't exist, or (for a site role) isn't registered on that site. This function
// does NOT check who is calling: callers must call requireRole() first.
export async function getWorkerById({ workerId, siteId, includeIdNumber = false }: Options) {
  if (!isUuid(workerId)) return null; // a malformed id would make Postgres throw
  if (siteId !== undefined && !isUuid(siteId)) return null;

  const [worker] = await db
    .select({
      id: workers.id,
      firstName: workers.firstName,
      lastName: workers.lastName,
      trade: workers.trade,
      phone: workers.phone,
      email: workers.email,
      idNumber: workers.idNumber,
      createdAt: workers.createdAt,
    })
    .from(workers)
    .where(
      and(
        eq(workers.id, workerId),
        siteId
          ? sql`exists (
              select 1 from ${siteWorkers} sw
              where sw.worker_id = ${workers}.id and sw.site_id = ${siteId}
            )`
          : undefined,
      ),
    )
    .limit(1);

  if (!worker) return null;

  // Attendance only counts the caller's own site, so a worker assigned to two sites never
  // exposes one site's reports to the other.
  const onSite = siteId ? eq(reports.siteId, siteId) : undefined;

  const [siteRows, [stats], recent] = await Promise.all([
    db
      .select({ id: sites.id, name: sites.name, status: sites.status })
      .from(siteWorkers)
      .innerJoin(sites, eq(sites.id, siteWorkers.siteId))
      .where(and(eq(siteWorkers.workerId, workerId), siteId ? eq(siteWorkers.siteId, siteId) : undefined))
      .orderBy(asc(sites.name)),

    db
      .select({
        reportsAttended: count(),
        totalHours: sql<string>`coalesce(sum(${reportWorkers.hours}), 0)`,
        lastWorked: max(reports.createdAt),
      })
      .from(reportWorkers)
      .innerJoin(reports, eq(reports.id, reportWorkers.reportId))
      .where(and(eq(reportWorkers.workerId, workerId), onSite)),

    db
      .select({
        reportId: reports.id,
        createdAt: reports.createdAt,
        siteName: sites.name,
        hours: reportWorkers.hours,
      })
      .from(reportWorkers)
      .innerJoin(reports, eq(reports.id, reportWorkers.reportId))
      .innerJoin(sites, eq(sites.id, reports.siteId))
      .where(and(eq(reportWorkers.workerId, workerId), onSite))
      // The id keeps the order stable if two reports share a timestamp.
      .orderBy(desc(reports.createdAt), desc(reports.id))
      .limit(10),
  ]);

  return {
    ...worker,
    // Stripped here, so the number never leaves this function for roles that don't need it.
    idNumber: includeIdNumber ? worker.idNumber : null,
    sites: siteRows,
    stats,
    recent,
  };
}

export type WorkerDetails = NonNullable<Awaited<ReturnType<typeof getWorkerById>>>;



export type SiteWorker = Awaited<
  ReturnType<typeof getWorkersBySiteId>
>[number];
