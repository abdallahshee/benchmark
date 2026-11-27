import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton, Stack } from "@mantine/core";

import { AdminPage } from "@/components/admin-ui";
import { SiteWorkers } from "@/components/workers/site-workers";
import { requireRole } from "@/lib/auth";
import { getWorkersBySiteId } from "@/lib/workers";
import { getForemanSite } from "../actions";

export const metadata: Metadata = {
  title: "Site Workers",
  description: "View workers assigned to your construction site.",
};

function WorkersSkeleton() {
  return (
    <Stack gap="lg">
      <Skeleton height={24} width={180} />
      <Skeleton height={16} width={260} />

      <Stack gap="xs">
        <Skeleton height={48} radius="md" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} height={52} radius="sm" />
        ))}
      </Stack>
    </Stack>
  );
}

async function ForemanWorkersContent() {
  const user = await requireRole("foreman");
  const site = await getForemanSite(user.id);

  if (!site) {
    return (
      <AdminPage
        title="Site Workers"
        description="Workers assigned to your construction site."
      >
        <p>You are not currently assigned to a construction site.</p>
      </AdminPage>
    );
  }

  const workers = await getWorkersBySiteId(site.id);

  return (
    <AdminPage
      title="Site Workers"
      description={`Workers assigned to ${site.name}.`}
    >
      <SiteWorkers
        workers={workers}
        user={user}
        title="Workers"
        description={`All workers assigned to ${site.name}`}
      />
    </AdminPage>
  );
}

export default function ForemanWorkersPage() {
  return (
    <Suspense
      fallback={
        <AdminPage
          title="Site Workers"
          description="Workers assigned to your construction site."
        >
          <WorkersSkeleton />
        </AdminPage>
      }
    >
      <ForemanWorkersContent />
    </Suspense>
  );
}