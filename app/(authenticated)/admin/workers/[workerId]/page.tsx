import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage } from "@/components/admin-ui";
// import { WorkerDetailsView } from "@/components/workers/worker-details-view";
import { requireRole } from "@/lib/auth";
import { getWorkerById } from "@/lib/workers";
import { WorkerDetailsView } from "@/components/workers/worker-details";


export const metadata: Metadata = { title: "Worker" };

type PageProps = { params: Promise<{ workerId: string }> };

const BACK = { href: "/admin", label: "Dashboard" };

export default function AdminWorkerPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Worker" back={BACK}>
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <AdminWorker params={params} />
    </Suspense>
  );
}

async function AdminWorker({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { workerId } = await params;
  const worker = await getWorkerById({ workerId, includeIdNumber: true });
  if (!worker) notFound();

  return (
    <WorkerDetailsView
      worker={worker}
      back={BACK}
      reportsBasePath="/admin/reports"
      sitesBasePath="/admin/sites"
    />
  );
}