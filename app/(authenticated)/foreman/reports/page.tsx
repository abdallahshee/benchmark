import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel } from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import type { ReportStatus } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getSiteReports, parseReportFilters } from "@/lib/queries/site-reports";
import { SiteReportsSection } from "@/components/site-reports-section";

export const metadata: Metadata = { title: "Reports" };

// The foreman sees every status of their own reports, drafts included.
const ALLOWED: readonly ReportStatus[] = ["draft", "approved", "rejected"];

type PageProps = {
  searchParams: Promise<{
    status?: string | string[];
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
  }>;
};

export default function ForemanReportsPage({ searchParams }: PageProps) {
  return (
    <AdminPage
      title="Reports"
      description="Your site's reports, newest first."
      back={{ href: "/foreman", label: "Dashboard" }}
      actions={<LinkButton href="/foreman/reports/today">Today&apos;s report</LinkButton>}
    >
      <Suspense fallback={<Skeleton height={420} radius="md" />}>
        <ForemanReports searchParams={searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function ForemanReports({ searchParams }: PageProps) {
  const user = await requireRole("foreman"); // check access before any query runs

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

  const filters = parseReportFilters(await searchParams, ALLOWED);
  const data = await getSiteReports({ siteId: user.siteId, allowed: ALLOWED, ...filters });

  return (
    <SiteReportsSection
      data={data}
      filters={filters}
      basePath="/foreman/reports"
      detailsBasePath="/foreman/reports"
    />
  );
}