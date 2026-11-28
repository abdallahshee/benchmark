import "server-only";

import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { reportWorkers, reports, siteWorkers, workers } from "@/db/schema";

// % and _ are wildcards in LIKE, so a search for "100%" must not match everything.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

// The workers registered on one site, by name. With `search`, only those whose name, trade
// or phone contains the text (case-insensitive). This function does NOT check access:
// callers must call requireRole() first and pass the site from the signed-in user's
// profile, never from the browser.
export async function getSiteWorkers(siteId: string, { search }: { search?: string } = {}) {
  const conditions: SQL[] = [eq(siteWorkers.siteId, siteId)];

  if (search) {
    const term = `%${escapeLike(search)}%`;
    const matches: SQL[] = [
      ilike(workers.firstName, term),
      ilike(workers.lastName, term),
      ilike(sql`concat_ws(' ', ${workers.firstName}, ${workers.lastName})`, term),
      ilike(workers.trade, term),
      ilike(workers.phone, term),
    ];
    // A number typed as "0722 000 111" should still find the stored phone.
    if (/^[\d\s+()-]+$/.test(search)) {
      const digits = search.replace(/\D/g, "");
      if (digits) matches.push(sql`regexp_replace(${workers.phone}, '[^0-9]', '', 'g') like ${`%${digits}%`}`);
    }
    const any = or(...matches);
    if (any) conditions.push(any);
  }

  return db
    .select({
      id: workers.id,
      firstName: workers.firstName,
      lastName: workers.lastName,
      trade: workers.trade,
      phone: workers.phone,
      // Epoch milliseconds of the latest report on this site that the worker attended.
      lastWorked: sql<number | null>`(
        select (extract(epoch from max(r.created_at)) * 1000)::double precision
        from ${reportWorkers} rw
        join ${reports} r on r.id = rw.report_id
        where rw.worker_id = ${workers}.id and r.site_id = ${siteId}
      )`,
    })
    .from(siteWorkers)
    .innerJoin(workers, eq(workers.id, siteWorkers.workerId))
    .where(and(...conditions))
    .orderBy(asc(workers.firstName), asc(workers.lastName));
}

export type SiteWorkerRow = Awaited<ReturnType<typeof getSiteWorkers>>[number];