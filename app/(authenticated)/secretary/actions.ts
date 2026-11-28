import { db } from "@/db";
import { profiles, sites } from "@/db/schema";
import { isUuid } from "@/lib/helper";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getSecretarySite = cache(async (secretaryId: string) => {
  if (!isUuid(secretaryId)) return null;

  const [site] = await db
    .select({
      id: sites.id,
      name: sites.name,
    })
    .from(profiles)
    .innerJoin(sites, eq(profiles.siteId, sites.id))
    .where(eq(profiles.id, secretaryId))
    .limit(1);

  return site ?? null;
});


"use server";

import { siteWorkers, workers } from "@/db/schema";

import { requireRole } from "@/lib/auth";
import { AddWorkerInput, AddWorkerSchema } from "@/forms/worker-form";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

// Drizzle wraps driver errors, so the Postgres error code may be on `cause`.
function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}

export async function addWorker(input: AddWorkerInput): Promise<ActionResult> {
  // Actions are public endpoints, so check the role first. The site comes from the
  // secretary's profile on the server, never from the browser.
  const user = await requireRole("secretary");
  if (!user.siteId) return { ok: false, error: "You are not assigned to a site yet." };
  const siteId = user.siteId;

  const parsed = AddWorkerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the details." };
  }
  const d = parsed.data;

  try {
    // One transaction, so a worker is never saved without being registered on the site.
    await db.transaction(async (tx) => {
      const [worker] = await tx
        .insert(workers)
        .values({
          firstName: d.firstName,
          lastName: d.lastName,
          idNumber: d.idNumber.toUpperCase(),
          phone: d.phone.replace(/[\s-]/g, ""),
          email: d.email ? d.email.toLowerCase() : null,
          // Lower case, so "Plumber" and "plumber" are one trade in the totals.
          trade: d.trade.toLowerCase(),
        })
        .returning({ id: workers.id });

      await tx.insert(siteWorkers).values({ siteId, workerId: worker.id });
    });
  } catch (error) {
    // The ID number is unique across all sites.
    if (pgCode(error) === "23505") {
      return {
        ok: false,
        error:
          "A worker with this ID number is already registered. If they work on your site, ask the engineer to add them to it.",
      };
    }
    console.error("Failed to add worker:", error);
    return { ok: false, error: "Could not add the worker. Please try again." };
  }

  revalidatePath("/secretary/workers");
  revalidatePath("/secretary/my-site");
  revalidatePath("/foreman/reports/new"); // the foreman's attendance list
  return { ok: true, message: `${d.firstName} ${d.lastName} was added to your site` };
}