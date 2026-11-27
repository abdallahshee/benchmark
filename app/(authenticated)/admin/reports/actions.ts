import { db } from "@/db";
import { machineries, materials, profiles, reports, sites } from "@/db/schema";
import { isUuid, TZ } from "@/lib/helper";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { cache } from "react";

// "Created" dates are compared in the site's time zone, as on the pages.
// const TZ = sql.raw("'Africa/Nairobi'");
import "server-only";



// "Created" days are compared in the site's time zone. Change this if your sites are elsewhere.
// const TZ = sql.raw("'Africa/Nairobi'");

// A ?from= or ?to= value as "YYYY-MM-DD", or null if it is missing or not a real date.
export function parseDay(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid =
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return valid ? v : null; // rejects impossible dates such as 2026-02-31
}

// Every report with its site and creator, newest first, then by site name. The optional
// range is inclusive and applies to the day the report was created. This function does NOT
// check access: callers must call requireRole() first.
export async function getReports({ from, to }: { from?: string | null; to?: string | null } = {}) {
  const createdDay = sql`(${reports.createdAt} at time zone ${TZ})::date`;
  const conditions: SQL[] = [];
  if (from) conditions.push(sql`${createdDay} >= ${from}::date`);
  if (to) conditions.push(sql`${createdDay} <= ${to}::date`);

  return db
    .select({
      id: reports.id,
      createdAt: reports.createdAt,
      siteId: sites.id,
      siteName: sites.name,
      // Null when the creator's account has been deleted.
      creatorFirstName: profiles.firstName,
      creatorLastName: profiles.lastName,
    })
    .from(reports)
    .innerJoin(sites, eq(sites.id, reports.siteId))
    .leftJoin(profiles, eq(profiles.id, reports.createdBy))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(reports.createdAt), asc(sites.name));
}



// One report with everything on it: site, creator, machineries, materials and the
// materials total. Returns null for a malformed or unknown id.
// This function does NOT check access: callers must call requireRole() first.
export const getReportById = cache(async (id: string) => {
  if (!isUuid(id)) return null; // a malformed id would make Postgres throw

  const [reportRows, machineryRows, materialRows, totalRows] = await Promise.all([
    db
      .select({
        id: reports.id,
        // status: reports.status,
        reportDate: reports.createdAt,
        notes: reports.notes,
        createdAt: reports.createdAt,
        siteId: sites.id,
        siteName: sites.name,
        creatorFirstName: profiles.firstName,
        creatorLastName: profiles.lastName,
      })
      .from(reports)
      .innerJoin(sites, eq(sites.id, reports.siteId))
      .leftJoin(profiles, eq(profiles.id, reports.createdBy))
      .where(eq(reports.id, id))
      .limit(1),

    db
      .select({
        id: machineries.id,
        category: machineries.category,
        number: machineries.number,
        hours: machineries.hours,
      })
      .from(machineries)
      .where(eq(machineries.reportId, id))
      .orderBy(asc(machineries.category)),

    db
      .select({
        id: materials.id,
        name: materials.name,
        quantity: materials.quantity,
        unit: materials.unit,
        unitCost: materials.unitCost,
        // Plain SQL so Postgres does the exact decimal math.
        lineCost: sql<string>`(quantity * unit_cost)`,
      })
      .from(materials)
      .where(eq(materials.reportId, id))
      .orderBy(asc(materials.name)),

    db
      .select({ total: sql<string>`coalesce(sum(quantity * unit_cost), 0)` })
      .from(materials)
      .where(eq(materials.reportId, id)),
  ]);

  const report = reportRows[0];
  if (!report) return null;

  return {
    ...report,
    machineries: machineryRows,
    materials: materialRows,
    materialsTotal: totalRows[0]?.total ?? "0",
  };
});

export type ReportDetails = NonNullable<Awaited<ReturnType<typeof getReportById>>>;