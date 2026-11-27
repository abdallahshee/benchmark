import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { machineries, materials, profiles, reports, sites } from "@/db/schema";
import { isUuid } from "../helper";
// use the path your isUuid lives at (site-reports.ts used ../helper)

type Options = {
  id: string;
  // For the foreman and secretary: their own site, taken from their profile. The report
  // must belong to it. Leave it out only for the admin, who sees every site.
  siteId?: string;
};

// One report with its site, creator, machinery, materials and the materials total. Returns
// null when the id is malformed, the report doesn't exist, or it belongs to another site.
// This function does NOT check who is calling: callers must call requireRole() first.
export async function getReportDetails({ id, siteId }: Options) {
  if (!isUuid(id)) return null; // a malformed id would make Postgres throw
  if (siteId !== undefined && !isUuid(siteId)) return null;

  const [report] = await db
    .select({
      id: reports.id,
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
    .where(and(eq(reports.id, id), siteId ? eq(reports.siteId, siteId) : undefined))
    .limit(1);

  if (!report) return null;

  // Only fetched once access is confirmed.
  const [machineryRows, materialRows, [totals]] = await Promise.all([
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

  return {
    ...report,
    machineries: machineryRows,
    materials: materialRows,
    materialsTotal: totals?.total ?? "0",
  };
}

export type ReportDetails = NonNullable<Awaited<ReturnType<typeof getReportDetails>>>;