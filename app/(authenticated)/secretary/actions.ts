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
