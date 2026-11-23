import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminPage, Panel } from "@/components/admin-ui";
import { requireRole } from "@/lib/auth";
import { SITE_ROLES, type SiteRole } from "@/lib/site-roles";

import { NewSiteUserForm } from "@/app/(authenticated)/admin/users/invite-user-form";
import { getSiteById } from "../../action";

export const metadata: Metadata = {
  title: "Add site staff",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
};

export default function NewSiteUserPage({
  params,
  searchParams,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage
          title="Add staff"
          back={{ href: "/admin/sites", label: "Sites" }}
        >
          <Skeleton height={320} radius="md" />
        </AdminPage>
      }
    >
      <NewSiteUser
        params={params}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

async function NewSiteUser({
  params,
  searchParams,
}: PageProps) {
  await requireRole("admin");

  const [{ id }, { role }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!role || !SITE_ROLES.includes(role as SiteRole)) {
    redirect(`/admin/sites/${id}/users`);
  }

  const site = await getSiteById(id);

  if (!site) notFound();

  const selectedRole = role as SiteRole;

  return (
    <AdminPage
      title={`Add ${selectedRole}`}
      description={`Invite a ${selectedRole} to ${site.name}.`}
      back={{
        href: `/admin/sites/${site.id}/users`,
        label: "Site users",
      }}
    >
      <Panel
        title={`${selectedRole === "foreman" ? "Foreman" : "Secretary"} details`}
        description="They will receive an email to set up their account."
      >
        <NewSiteUserForm
          siteId={site.id}
          role={selectedRole}
        />
      </Panel>
    </AdminPage>
  );
}