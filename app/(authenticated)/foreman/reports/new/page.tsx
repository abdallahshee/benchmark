import { Skeleton } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel } from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { displayName, formatDay } from "@/lib/formats";
import { getNewReportContext } from "@/lib/queries/new-report";
import { ReportForm } from "@/components/reports/new-report";
// import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "New report" };

const BACK = { href: "/foreman", label: "Dashboard" };

export default function NewReportPage() {
  return (
    <Suspense
      fallback={
        <AdminPage title="New report" back={BACK}>
          <Skeleton height={420} radius="md" />
        </AdminPage>
      }
    >
      <NewReport />
    </Suspense>
  );
}

async function NewReport() {
  const user = await requireRole("foreman"); // check access before any query runs

  // The site comes from the signed-in user's profile, never from the URL.
  const context = user.siteId ? await getNewReportContext(user.siteId) : null;

  if (!context?.site) {
    return (
      <AdminPage title="New report" back={BACK}>
        <Panel>
          <EmptyState
            title="No site assigned yet"
            text="Ask the engineer to assign you to a site. Until then you can't record reports."
          />
        </Panel>
      </AdminPage>
    );
  }

  if (context.site.status !== "active") {
    return (
      <AdminPage title="New report" back={BACK}>
        <Panel>
          <EmptyState
            title="This site is completed"
            text="Reports can only be recorded on active sites."
          />
        </Panel>
      </AdminPage>
    );
  }

  // A site has one report per day.
  if (context.today) {
    return (
      <AdminPage title="New report" back={BACK}>
        <Panel>
          <EmptyState
            title="Today's report is already submitted"
            text="A site has one report per day. You can create the next one tomorrow."
          />
          <div className="flex justify-center pb-4">
            <LinkButton href={`/foreman/reports/${context.today.id}`} variant="light">
              View today&apos;s report
            </LinkButton>
          </div>
        </Panel>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="New report"
      description={`${context.site.name} · ${formatDay(new Date())}`}
      back={BACK}
    >
      <ReportForm
        siteWorkers={context.workers.map((w) => ({
          id: w.id,
          name: displayName(w),
          trade: w.trade,
        }))}
      />
    </AdminPage>
  );
}