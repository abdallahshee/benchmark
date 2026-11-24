import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage } from "@/components/admin-ui";
import type { ReportStatus } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getSiteReports, parseReportFilters } from "@/lib/queries/site-reports";
import { getSiteById } from "../action";
import { SiteReportsSection } from "@/components/site-reports-section";

export const metadata: Metadata = { title: "Site reports" };

// The admin sees only reports the secretary has approved or rejected.
const ALLOWED: readonly ReportStatus[] = ["approved", "rejected"];

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    status?: string | string[];
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
  }>;
};

export default function SiteReportsPage({ params, searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Reports" back={{ href: "/admin/sites", label: "Sites" }}>
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <SiteReports params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SiteReports({ params, searchParams }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { id } = await params;
  const site = await getSiteById(id);
  if (!site) notFound();

  const filters = parseReportFilters(await searchParams, ALLOWED);
  const data = await getSiteReports({ siteId: site.id, allowed: ALLOWED, ...filters });

  return (
    <AdminPage
      title="Reports"
      description={`Approved and rejected reports for ${site.name}, newest first.`}
      back={{ href: `/admin/sites/${site.id}`, label: site.name }}
    >
      <SiteReportsSection
        data={data}
        filters={filters}
        basePath={`/admin/sites/${site.id}/reports`}
        detailsBasePath="/admin/reports"
      />
    </AdminPage>
  );
}