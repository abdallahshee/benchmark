import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel } from "@/components/admin-ui";
import { requireRole } from "@/lib/auth";
import { AddWorkerForm } from "@/components/workers/add-worker-form";


export const metadata: Metadata = { title: "Add worker" };

const BACK = { href: "/secretary/workers", label: "Workers" };

export default function NewWorkerPage() {
  return (
    <Suspense
      fallback={
        <AdminPage title="Add worker" back={BACK}>
          <Skeleton height={320} radius="md" />
        </AdminPage>
      }
    >
      <NewWorker />
    </Suspense>
  );
}

async function NewWorker() {
  const user = await requireRole("secretary"); // check access before anything renders

  return (
    <AdminPage
      title="Add worker"
      description="Register a worker on your site. They can't sign in to the app."
      back={BACK}
    >
      <Panel title="Worker details">
        {user.siteId ? (
          <AddWorkerForm />
        ) : (
          <EmptyState
            title="No site assigned yet"
            text="Ask the engineer to assign you to a site. Until then you can't register workers."
          />
        )}
      </Panel>
    </AdminPage>
  );
}