
import { db } from "@/db";
import { siteWorkers, sites, workers } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { cache } from "react";

export const getAllWorkers = cache(async () => {
  return db
    .select({
      id: workers.id,
      firstName: workers.firstName,
      lastName: workers.lastName,
      idNumber: workers.idNumber,
      phone: workers.phone,
      email: workers.email,
      trade: workers.trade,
      createdAt: workers.createdAt,

      siteNames: sql<string | null>`(
        select string_agg(
          distinct ${sites.name},
          ', ' order by ${sites.name}
        )
        from ${siteWorkers}
        inner join ${sites}
          on ${sites.id} = ${siteWorkers.siteId}
        where ${siteWorkers.workerId} = ${workers.id}
      )`,
    })
    .from(workers)
    .orderBy(asc(workers.firstName), asc(workers.lastName));
});

export type Worker = Awaited<
  ReturnType<typeof getAllWorkers>
>[number];
