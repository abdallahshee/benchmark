import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage } from "@/components/admin-ui";
import { ReportDetailsView } from "@/components/reports/report-details-view";
import { requireRole } from "@/lib/auth";
import { REPORT_VISIBILITY } from "@/lib/report-access";
import { getReportDetails } from "@/lib/queries/report-details";

export const metadata: Metadata = { title: "Report" };

type PageProps = { params: Promise<{ id: string }> };

export default function ForemanReportPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Report" back={{ href: "/foreman/reports", label: "Reports" }}>
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <ForemanReport params={params} />
    </Suspense>
  );
}

async function ForemanReport({ params }: PageProps) {
  const user = await requireRole("foreman"); // check access before any query runs
  if (!user.siteId) notFound(); // a foreman with no site has no reports

  const { id } = await params;
  // The site comes from the signed-in user's profile, never from the URL, so another
  // site's report is "not found" even with its exact id.
  const report = await getReportDetails({
    id,
    allowed: REPORT_VISIBILITY.foreman,
    siteId: user.siteId,
  });
  if (!report) notFound();

  return (
    <ReportDetailsView report={report} back={{ href: "/foreman/reports", label: "Reports" }} />
  );
}