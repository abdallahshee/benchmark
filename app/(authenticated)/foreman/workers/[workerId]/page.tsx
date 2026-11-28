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

const BACK = { href: "/foreman", label: "Dashboard" };

export default function ForemanWorkerPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Worker" back={BACK}>
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <ForemanWorker params={params} />
    </Suspense>
  );
}

async function ForemanWorker({ params }: PageProps) {
  const user = await requireRole("foreman"); // check access before any query runs
  if (!user.siteId) notFound(); // a foreman with no site has no workers

  const { workerId } = await params;
  // No ID number for the foreman: includeIdNumber stays false.
  const worker = await getWorkerById({ workerId, siteId: user.siteId });
  if (!worker) notFound();

  return <WorkerDetailsView worker={worker} back={BACK} reportsBasePath="/foreman/reports" />;
}