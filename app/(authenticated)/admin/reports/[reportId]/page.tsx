import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage } from "@/components/admin-ui";
import { ReportDetailsView } from "@/components/reports/report-details-view";
import { requireRole } from "@/lib/auth";
// import { REPORT_VISIBILITY } from "@/lib/report-access";
import { getReportDetails } from "@/lib/queries/report-details";

export const metadata: Metadata = { title: "Report" };

type PageProps = { params: Promise<{ reportId: string }> };

export default function AdminReportPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Report" back={{ href: "/admin/reports", label: "Reports" }}>
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <AdminReport params={params} />
    </Suspense>
  );
}

async function AdminReport({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { reportId} = await params;
  const report = await getReportDetails({ reportId});
  if (!report) notFound();

  return (
    <ReportDetailsView
      report={report}
      back={{ href: "/admin/reports", label: "Reports" }}
      siteHref={`/admin/sites/${report.siteId}`}
    />
  );
}