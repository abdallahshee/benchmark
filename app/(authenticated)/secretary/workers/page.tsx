import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton, Stack } from "@mantine/core";

import { AdminPage } from "@/components/admin-ui";
import { SiteWorkers } from "@/components/workers/site-workers";
import { requireRole } from "@/lib/auth";
import { getWorkersBySiteId } from "@/lib/workers";
import { getSecretarySite } from "../actions";

export const metadata: Metadata = {
  title: "Site Workers",
  description: "View workers assigned to your construction site.",
};

function WorkersSkeleton() {
  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Skeleton height={24} width={200} />
        <Skeleton height={16} width={280} />
      </Stack>

      <Stack gap="xs">
        <Skeleton height={48} radius="md" />

        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} height={52} radius="sm" />
        ))}
      </Stack>
    </Stack>
  );
}

async function SecretaryWorkersContent() {
  const user = await requireRole("secretary");
  const site = await getSecretarySite(user.id);

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

export default function SecretaryWorkersPage() {
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
      <SecretaryWorkersContent />
    </Suspense>
  );
}