import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage } from "@/components/admin-ui";
import { ReportDetailsView } from "@/components/reports/report-details-view";
import { requireRole } from "@/lib/auth";
import { getReportDetails } from "@/lib/queries/report-details";
import { getForemanSite } from "../../actions";

export const metadata: Metadata = {
  title: "Report",
};

type PageProps = {
  params: Promise<{ reportId: string }>;
};

export default function UserReportPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage
          title="Report"
          back={{ href: "/foreman/reports", label: "Reports" }}
        >
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <AppReport params={params} />
    </Suspense>
  );
}

async function AppReport({ params }: PageProps) {
  const user = await requireRole("foreman");

  const { reportId } = await params;

  const site = await getForemanSite(user.id);

  if (!site) {
    notFound();
  }

  const report = await getReportDetails({
    reportId,
    siteId: site.id,
  });

  if (!report) {
    notFound();
  }

  return (
    <ReportDetailsView
      report={report}
      back={{ href: "/foreman/reports", label: "Reports" }}
    />
  );
}