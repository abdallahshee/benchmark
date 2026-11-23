import { db } from "@/db";
import { profiles, reports, sites } from "@/db/schema";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";

// "Created" dates are compared in the site's time zone, as on the pages.
const TZ = sql.raw("'Africa/Nairobi'");

// Turns a ?from= or ?to= value into "YYYY-MM-DD", or null if it is missing or not a
// real date. Query strings are user input, so bad values are ignored, never trusted.
export function parseDay(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid =
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return valid ? v : null; // rejects impossible dates such as 2026-02-31
}

// Every report with its site and creator, newest first, then by site name. The
// optional range is inclusive and applies to the day the report was created.
export async function getReports({ from, to }: { from?: string | null; to?: string | null } = {}) {
  const createdDay = sql`(${reports.createdAt} at time zone ${TZ})::date`;
  const conditions: SQL[] = [];
  if (from) conditions.push(sql`${createdDay} >= ${from}::date`);
  if (to) conditions.push(sql`${createdDay} <= ${to}::date`);

  return db
    .select({
      id: reports.id,
      status: reports.status,
      createdAt: reports.createdAt,
      siteId: sites.id,
      siteName: sites.name,
      creatorFirstName: profiles.firstName,
      creatorLastName: profiles.lastName,
    })
    .from(reports)
    .innerJoin(sites, eq(sites.id, reports.siteId))
    .leftJoin(profiles, eq(profiles.id, reports.createdBy))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(reports.createdAt), asc(sites.name));
}