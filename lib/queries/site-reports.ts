import "server-only";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { machineries, materials, profiles, reports } from "@/db/schema";
import type { ReportStatus } from "@/db/schema";
import { isUuid } from "../helper";


export const PAGE_SIZE = 10;

const LABEL: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
  rejected: "Rejected",
};

export type ReportFilters = {
  status: ReportStatus | null;
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

// The query string is user input, so every value is checked: the status must be one this
// role may see, the dates must be real, and the page must be a positive number.
export function parseReportFilters(
  params: {
    status?: string | string[];
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
  },
  allowed: readonly ReportStatus[],
): ReportFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const requested = first(params.status);
  const status = allowed.find((s) => s === requested) ?? null;

  let from = parseDay(first(params.from));
  let to = parseDay(first(params.to));
  if (from && to && from > to) [from, to] = [to, from]; // tolerate a reversed range

  const n = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 1;

  return { status, from, to, page };
}

type Options = Partial<ReportFilters> & {
  siteId: string;
  // The statuses this role may see. Anything else is never returned, whatever the URL says.
  allowed: readonly ReportStatus[];
};

// One site's reports, newest first, with counts for the filter tabs. This function does NOT
// check access: callers must call requireRole() first and pass the site from the user's own
// profile (or, for the admin, a site that exists), never an id taken from the browser.
export async function getSiteReports({
  siteId,
  allowed,
  status = null,
  from = null,
  to = null,
  page = 1,
}: Options) {
  const empty = {
    rows: [],
    total: 0,
    totalAll: 0,
    page: 1,
    pageCount: 1,
    options: [] as { value: string; label: string; count: number }[],
  };
  if (!isUuid(siteId) || allowed.length === 0) return empty;

  // Everything except the status tab, so the tab counts respond to the date range.
  const base = [eq(reports.siteId, siteId), inArray(reports.status, [...allowed])];
  if (from) base.push(sql`${reports.createdAt} >= ${from}::date`);
  if (to) base.push(sql`${reports.createdAt} <= ${to}::date`);

  const countRows = await db
    .select({ status: reports.status, total: count() })
    .from(reports)
    .where(and(...base))
    .groupBy(reports.status);

  const counts: Record<string, number> = {};
  for (const s of allowed) counts[s] = 0;
  for (const row of countRows) counts[row.status] = row.total;

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  const selected = status && allowed.includes(status) ? status : null;
  const total = selected ? counts[selected] : totalAll;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const rows = await db
    .select({
      id: reports.id,
      status: reports.status,
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
    .where(and(...base, selected ? eq(reports.status, selected) : undefined))
    .orderBy(desc(reports.createdAt))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  return {
    rows,
    total,
    totalAll,
    page: currentPage,
    pageCount,
    options: [
      { value: "all", label: "All", count: totalAll },
      ...allowed.map((s) => ({ value: s as string, label: LABEL[s] ?? s, count: counts[s] })),
    ],
  };
}

export type SiteReportsResult = Awaited<ReturnType<typeof getSiteReports>>;