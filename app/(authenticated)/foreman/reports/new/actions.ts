"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { machineries, materials, reportWorkers, reports, siteWorkers, sites } from "@/db/schema";
import { requireRole } from "@/lib/auth";

// numeric(12,2) holds up to 10 digits before the decimal point.
const MAX_AMOUNT = 9_999_999_999;

// The browser's checks can be bypassed, so everything is validated again here.
const reportSchema = z.object({
  notes: z.string().trim().max(2000, "Notes can be at most 2000 characters"),
  machineries: z
    .array(
      z.object({
        category: z.string().trim().min(1, "Enter a category for every machine").max(60, "A machine category is too long"),
        number: z.number().int("Machines must be a whole number").min(1, "Enter at least 1 machine").max(1000),
        hours: z.number().min(0, "Hours can't be negative").max(24, "Hours can't be more than 24"),
      }),
    )
    .max(50, "Too many machinery lines"),
  materials: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Enter a name for every material").max(100, "A material name is too long"),
        quantity: z.number().gt(0, "Material quantities must be more than 0").max(MAX_AMOUNT),
        unit: z.string().trim().min(1, "Enter a unit for every material").max(30, "A unit is too long"),
        unitCost: z.number().min(0, "Unit costs can't be negative").max(MAX_AMOUNT),
      }),
    )
    .max(100, "Too many material lines"),
  workers: z
    .array(
      z.object({
        workerId: z.string().uuid(),
        hours: z.number().gt(0, "Worker hours must be more than 0").max(24, "Hours can't be more than 24"),
      }),
    )
    .max(500, "Too many workers"),
});

export type NewReportInput = z.input<typeof reportSchema>;
export type NewReportResult = { ok: true; id: string } | { ok: false; error: string };

// The first repeated value (ignoring case), or null.
function firstDuplicate(values: string[]) {
  const seen = new Set<string>();
  for (const v of values) {
    const key = v.toLowerCase();
    if (seen.has(key)) return v;
    seen.add(key);
  }
  return null;
}

// Drizzle wraps driver errors, so the Postgres error code may be on `cause`.
function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}

export async function createReport(input: NewReportInput): Promise<NewReportResult> {
  // Actions are public endpoints, so check the role first. The site comes from the user's
  // profile on the server, never from the browser.
  const user = await requireRole("foreman");
  if (!user.siteId) return { ok: false, error: "You are not assigned to a site yet." };
  const siteId = user.siteId;

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the report and try again." };
  }
  const data = parsed.data;

  const [site] = await db.select({ status: sites.status }).from(sites).where(eq(sites.id, siteId)).limit(1);
  if (!site || site.status !== "active") {
    return { ok: false, error: "Reports can only be recorded on active sites." };
  }

  const repeatedMachine = firstDuplicate(data.machineries.map((m) => m.category));
  if (repeatedMachine) return { ok: false, error: `"${repeatedMachine}" is listed twice under machinery. Combine the lines.` };
  if (firstDuplicate(data.workers.map((w) => w.workerId))) {
    return { ok: false, error: "A worker is listed twice." };
  }
  if (data.machineries.length + data.materials.length + data.workers.length === 0) {
    return { ok: false, error: "Add at least one machine, material or worker." };
  }

  // Every worker must be registered on the foreman's own site.
  if (data.workers.length > 0) {
    const ids = data.workers.map((w) => w.workerId);
    const assigned = await db
      .select({ id: siteWorkers.workerId })
      .from(siteWorkers)
      .where(and(eq(siteWorkers.siteId, siteId), inArray(siteWorkers.workerId, ids)));
    if (assigned.length !== ids.length) {
      return { ok: false, error: "A selected worker isn't registered on your site." };
    }
  }

  // One transaction, so a report is never saved half-way.
  let reportId: string;
  try {
    reportId = await db.transaction(async (tx) => {
      const [report] = await tx
        .insert(reports)
        .values({ siteId, createdBy: user.id, notes: data.notes || null })
        .returning({ id: reports.id });

      if (data.machineries.length > 0) {
        await tx.insert(machineries).values(
          data.machineries.map((m) => ({
            reportId: report.id,
            category: m.category,
            number: m.number,
            hours: m.hours.toFixed(2),
          })),
        );
      }
      if (data.materials.length > 0) {
        await tx.insert(materials).values(
          data.materials.map((m) => ({
            reportId: report.id,
            name: m.name,
            quantity: m.quantity.toFixed(2),
            unit: m.unit,
            unitCost: m.unitCost.toFixed(2),
          })),
        );
      }
      if (data.workers.length > 0) {
        await tx.insert(reportWorkers).values(
          data.workers.map((w) => ({
            reportId: report.id,
            workerId: w.workerId,
            hours: w.hours.toFixed(2),
          })),
        );
      }
      return report.id;
    });
  } catch (error) {
    // The unique index allows one report per site per day.
    if (pgCode(error) === "23505") {
      return { ok: false, error: "Today's report has already been submitted for this site." };
    }
    console.error("Failed to create report:", error);
    return { ok: false, error: "Could not save the report. Please try again." };
  }

  revalidatePath("/foreman");
  revalidatePath("/foreman/reports");
  revalidatePath("/secretary");
  revalidatePath("/secretary/reports");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/sites/${siteId}`);

  return { ok: true, id: reportId };
}