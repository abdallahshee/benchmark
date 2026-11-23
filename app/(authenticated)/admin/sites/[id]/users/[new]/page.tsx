import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage, Panel } from "@/components/admin-ui";
import { requireRole } from "@/lib/auth";
import { getSiteById } from "../../action";
import { NewSiteUserForm } from "@/app/(authenticated)/admin/users/invite-user-form";


export const metadata: Metadata = { title: "Add user" };

type PageProps = { params: Promise<{ id: string }> };

export default function NewSiteUserPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Add user" back={{ href: "/admin/sites", label: "Sites" }}>
          <Skeleton height={320} radius="md" />
        </AdminPage>
      }
    >
      <NewSiteUser params={params} />
    </Suspense>
  );
}

async function NewSiteUser({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { id } = await params;
  const site = await getSiteById(id);
  if (!site) notFound();

  return (
    <AdminPage
      title="New Staff"
      description={`Invite a foreman or secretary to ${site.name}.`}
      back={{ href: `/admin/sites/${site.id}`, label: site.name }}
    >
      <Panel title="User details" description="They get an email to set up their account.">
        <NewSiteUserForm siteId={site.id} />
      </Panel>
    </AdminPage>
  );
}