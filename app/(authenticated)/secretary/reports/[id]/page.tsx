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

export default function SecretaryReportPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Report" back={{ href: "/secretary/reports", label: "Reports" }}>
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <SecretaryReport params={params} />
    </Suspense>
  );
}

async function SecretaryReport({ params }: PageProps) {
  const user = await requireRole("secretary"); // check access before any query runs
  if (!user.siteId) notFound(); // a secretary with no site has no reports

  const { id } = await params;
  const report = await getReportDetails({
    id,
    allowed: REPORT_VISIBILITY.secretary, // drafts stay private to the foreman
    siteId: user.siteId,
  });
  if (!report) notFound();

  return (
    <ReportDetailsView report={report} back={{ href: "/secretary/reports", label: "Reports" }} />
  );
}