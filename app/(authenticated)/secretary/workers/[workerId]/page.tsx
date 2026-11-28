import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage } from "@/components/admin-ui";
// import { WorkerDetailsView } from "@/components/workers/worker-details-view";
import { requireRole } from "@/lib/auth";
import { getWorkerById } from "@/lib/workers";
import { WorkerDetailsView } from "@/components/workers/worker-details";
// import { getWorkerById } from "@/lib/queries/worker-details";

export const metadata: Metadata = { title: "Worker" };

type PageProps = { params: Promise<{ workerId: string }> };

const BACK = { href: "/secretary", label: "Dashboard" };

export default function SecretaryWorkerPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Worker" back={BACK}>
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <SecretaryWorker params={params} />
    </Suspense>
  );
}

async function SecretaryWorker({ params }: PageProps) {
  const user = await requireRole("secretary"); // check access before any query runs
  if (!user.siteId) notFound(); // a secretary with no site has no workers

  const { workerId } = await params;
  // The site comes from the signed-in user's profile, never from the URL, so another
  // site's worker is "not found" even with their exact id.
  const worker = await getWorkerById({ workerId, siteId: user.siteId, includeIdNumber: true });
  if (!worker) notFound();

  return <WorkerDetailsView worker={worker} back={BACK} reportsBasePath="/secretary/reports" />;
}