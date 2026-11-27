
import { db } from "@/db";
import { sites, siteWorkers, workers } from "@/db/schema";
import { isUuid } from "@/lib/helper";
import { asc, eq } from "drizzle-orm";
import { cache } from "react";

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
    .orderBy(asc(workers.firstName), asc(workers.lastName));
});

// Keep your existing getWorkersBySiteId function.

export const getWorkerById = cache(async (workerId: string) => {
  if (!isUuid(workerId)) return null;

  const [worker] = await db
    .select({
      id: workers.id,
      firstName: workers.firstName,
      lastName: workers.lastName,
      idNumber: workers.idNumber,
      phone: workers.phone,
      email: workers.email,
      trade: workers.trade,
      createdAt: workers.createdAt,
      updatedAt: workers.updatedAt,
    })
    .from(workers)
    .where(eq(workers.id, workerId))
    .limit(1);

  if (!worker) return null;

  const assignedSites = await db
    .select({
      id: sites.id,
      name: sites.name,
    })
    .from(siteWorkers)
    .innerJoin(sites, eq(siteWorkers.siteId, sites.id))
    .where(eq(siteWorkers.workerId, workerId))
    .orderBy(asc(sites.name));

  return {
    ...worker,
    assignedSites,
  };
});

export type WorkerDetails = NonNullable<
  Awaited<ReturnType<typeof getWorkerById>>
>;

export type SiteWorker = Awaited<
  ReturnType<typeof getWorkersBySiteId>
>[number];
