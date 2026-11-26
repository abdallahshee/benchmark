import "server-only";

import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { machineries, materials, profiles, reports } from "@/db/schema";
import { isUuid } from "../helper";

export const PAGE_SIZE = 10;

// "Today" and the day a report belongs to depend on the time zone. Change this if your
// sites are elsewhere.
const TZ = sql.raw("'Africa/Nairobi'");

// A report has no date column of its own: its day is the day it was created, in the
// site's time zone.
const createdDay = sql`((${reports.createdAt} at time zone ${TZ})::date)`;

export type ReportFilters = {
  from: string | null;
  to: string | null;
  page: number;
};

// A ?from= or ?to= value as "YYYY-MM-DD", or null if it is missing or not a real date.
function parseDay(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid =
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return valid ? value : null; // rejects impossible dates such as 2026-02-31
}

// The query string is user input, so every value is checked: the dates must be real and
// the page must be a positive number.
export function parseReportFilters(params: {
  from?: string | string[];
  to?: string | string[];
  page?: string | string[];
}): ReportFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  let from = parseDay(first(params.from));
  let to = parseDay(first(params.to));
  if (from && to && from > to) [from, to] = [to, from]; // tolerate a reversed range

  const n = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 1;

  return { from, to, page };
}

export type SiteReportRow = {
  id: string;
  createdAt: Date;
  creatorFirstName: string | null;
  creatorLastName: string | null;
  materialsCost: string;
  machineCount: number;
};

type Options = { siteId: string } & Partial<ReportFilters>;

// One site's reports, newest first, optionally limited to a date range, one page at a time.
// This function does NOT check access: callers must call requireRole() first and pass the
// site from the user's own profile (or, for the admin, a site that exists), never an id
// taken from the browser.
export async function getSiteReports({ siteId, from = null, to = null, page = 1 }: Options) {
  if (!isUuid(siteId)) {
    return { rows: [] as SiteReportRow[], total: 0, page: 1, pageCount: 1 };
  }

  const conditions: SQL[] = [eq(reports.siteId, siteId)];
  // Both ends are inclusive, and compared by day, so a report made late on the last day
  // is still included.
  if (from) conditions.push(sql`${createdDay} >= ${from}::date`);
  if (to) conditions.push(sql`${createdDay} <= ${to}::date`);
  const where = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(reports).where(where);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const rows = await db
    .select({
      id: reports.id,
      createdAt: reports.createdAt,
      creatorFirstName: profiles.firstName,
      creatorLastName: profiles.lastName,
      // Plain SQL so Postgres does the exact decimal math.
      materialsCost: sql<string>`coalesce(
        (select sum(m.quantity * m.unit_cost) from ${materials} m where m.report_id = ${reports}.id), 0
      )`,
      machineCount: sql<number>`coalesce(
        (select sum(c.number) from ${machineries} c where c.report_id = ${reports}.id), 0
      )::int`,
    })
    .from(reports)
    .leftJoin(profiles, eq(profiles.id, reports.createdBy))
    .where(where)
    // The id keeps the order stable between pages if two reports share a timestamp.
    .orderBy(desc(reports.createdAt), desc(reports.id))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  return { rows, total, page: currentPage, pageCount };
}

export type SiteReportsResult = Awaited<ReturnType<typeof getSiteReports>>;