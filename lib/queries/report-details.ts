import "server-only";

import {  asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  machineries,
  materials,
  profiles,
  reports,
  sites,
} from "@/db/schema";

import { isUuid } from "../helper";

type Options = {
  id: string;
};

// Retrieves a report by ID without checking its status or the caller's role.
export async function getReportDetails({ id }: Options) {
  if (!isUuid(id)) return null;

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
    .where(eq(reports.id, id))
    .limit(1);

  if (!report) return null;

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
        lineCost: sql<string>`(quantity * unit_cost)`,
      })
      .from(materials)
      .where(eq(materials.reportId, id))
      .orderBy(asc(materials.name)),

    db
      .select({
        total: sql<string>`coalesce(sum(quantity * unit_cost), 0)`,
      })
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

export type ReportDetails = NonNullable<
  Awaited<ReturnType<typeof getReportDetails>>
>;