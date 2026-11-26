import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel } from "@/components/admin-ui";

import { requireRole } from "@/lib/auth";
import { getSiteReports, parseReportFilters } from "@/lib/queries/site-reports";
// import { REPORT_VISIBILITY } from "@/lib/report-access"
import { SiteReportsSection } from "@/components/reports/site-reports-section";

export const metadata: Metadata = { title: "Reports" };

type PageProps = {
  searchParams: Promise<{
    status?: string | string[];
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
  }>;
};

export default function SecretaryReportsPage({ searchParams }: PageProps) {
  return (
    <AdminPage
      title="Reports"
      description="Your site's reports. Open a submitted report to review it."
      back={{ href: "/secretary", label: "Dashboard" }}
    >
      <Suspense fallback={<Skeleton height={420} radius="md" />}>
        <SecretaryReports searchParams={searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function SecretaryReports({ searchParams }: PageProps) {
  const user = await requireRole("secretary"); // check access before any query runs

  // The site comes from the signed-in user's profile, never from the URL.
  if (!user.siteId) {
    return (
      <Panel>
        <EmptyState
          title="No site assigned yet"
          text="Ask the engineer to assign you to a site. Until then you can't see reports."
        />
      </Panel>
    );
  }

  // Drafts stay private to the foreman, so they are never offered or returned.
  // const allowed = REPORT_VISIBILITY.secretary;
  const filters = parseReportFilters(await searchParams);
  const data = await getSiteReports({ siteId: user.siteId, ...filters });

  return (
    <SiteReportsSection
      data={data}
      filters={filters}
      basePath="/secretary/reports"
      detailsBasePath="/secretary/reports"
    />
  );
}