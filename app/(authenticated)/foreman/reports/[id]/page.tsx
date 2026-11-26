import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPage } from "@/components/admin-ui";
import { ReportDetailsView } from "@/components/reports/report-details-view";
import { getCurrentUser } from "@/lib/auth";
import { getReportDetails } from "@/lib/queries/report-details";

export const metadata: Metadata = {
  title: "Report",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ForemanReportPage({ params }: PageProps) {
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
      <ForemanReport params={params} />
    </Suspense>
  );
}

async function ForemanReport({ params }: PageProps) {
  // Only authenticated users can access reports.
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const { id } = await params;

  // Any authenticated user can open any report.
  const report = await getReportDetails({ id });

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