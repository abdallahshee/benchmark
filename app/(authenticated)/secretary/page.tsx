import { Divider, Group, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AdminPage,
  EmptyState,
  Panel,
  ReportStatusBadge,
  StatCard,
} from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { displayName, formatDate, formatDateTime, formatMoney } from "@/lib/formats";
import {
  SECRETARY_PENDING_SHOWN,
  getSecretaryDashboard,
  type SecretaryDashboard,
} from "@/lib/queries/secretary";

export const metadata: Metadata = { title: "Dashboard" };

export default function SecretaryDashboardPage() {
  return (
    <Suspense
      fallback={
        <AdminPage title="Dashboard">
          <Skeleton height={360} radius="md" />
        </AdminPage>
      }
    >
      <SecretaryDashboardContent />
    </Suspense>
  );
}

// What the "Today's report" panel says and where its button goes.
function todaySummary(report: SecretaryDashboard["today"]) {
  if (!report) {
    return {
      text: "The foreman hasn't sent today's report yet.",
      cta: null,
      href: "",
    };
  }
  const href = `/secretary/reports/${report.id}`;
  switch (report.status) {
    case "draft":
      return { text: "Today's report is waiting for your review.", cta: "Review report", href };
    case "approved":
      return { text: "You approved today's report.", cta: "View report", href };
    case "rejected":
      return { text: "You rejected today's report.", cta: "View report", href };
    default:
      return { text: "", cta: "View report", href };
  }
}

async function SecretaryDashboardContent() {
  const user = await requireRole("secretary"); // check access before any query runs

  const data = user.siteId ? await getSecretaryDashboard(user.siteId) : null;

  // No site on the profile, or the site no longer exists.
  if (!data?.site) {
    return (
      <AdminPage title={`Welcome, ${user.firstName || "Secretary"}`}>
        <Panel>
          <EmptyState
            title="No site assigned yet"
            text="Ask the engineer to assign you to a site. Until then you can't review reports."
          />
        </Panel>
      </AdminPage>
    );
  }

  const { site, today, counts, pending } = data;
  const summary = todaySummary(today);

  return (
    <AdminPage
      title={`Welcome, ${user.firstName || "Secretary"}`}
      description={`Site: ${site.name}`}
    >
      <Panel
        title="Today's report"
        description="One report per site, every day"
        action={today ? <ReportStatusBadge status={today.status} /> : undefined}
      >
        <Group justify="space-between" align="center" gap="md">
          <Text c={today ? undefined : "dimmed"} maw={560}>
            {summary.text}
          </Text>
          {summary.cta && <LinkButton href={summary.href}>{summary.cta}</LinkButton>}
        </Group>
      </Panel>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard
          label="Awaiting review"
          value={counts.draft}
          icon="inbox"
          color={counts.draft > 0 ? "yellow" : "gray"}
        />
        <StatCard label="Approved" value={counts.approved} icon="check" color="green" />
        <StatCard label="Rejected" value={counts.rejected} icon="reports" color="red" />
      </SimpleGrid>

      <Panel
        title="Awaiting your review"
        description={
          counts.draft > SECRETARY_PENDING_SHOWN
            ? `The ${SECRETARY_PENDING_SHOWN} oldest of ${counts.draft}`
            : "Oldest first"
        }
        action={
          <LinkButton href="/secretary/reports?status=submitted" size="xs" variant="light">
            Open queue
          </LinkButton>
        }
        flush
      >
        {pending.length === 0 ? (
          <EmptyState
            title="Nothing waiting for review"
            text="Reports appear here as soon as the foreman sends them."
          />
        ) : (
          <Stack gap={0}>
            {pending.map((r, i) => (
              <div key={r.id}>
                {i > 0 && <Divider />}
                <Group justify="space-between" px="lg" py="sm" wrap="nowrap" align="center">
                  <div>
                    <Text fw={600} size="sm">
                      {formatDate(r.createdAt)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {displayName({
                        firstName: r.creatorFirstName,
                        lastName: r.creatorLastName,
                      })}
                      {r.createdAt ? ` · sent ${formatDateTime(r.createdAt)}` : ""}
                    </Text>
                  </div>
                  <Group gap="md" wrap="nowrap">
                    <Text size="sm" c="dimmed" visibleFrom="xs">
                      Materials {formatMoney(r.materialsCost)}
                    </Text>
                    <LinkButton href={`/secretary/reports/${r.id}`} size="xs">
                      Review
                    </LinkButton>
                  </Group>
                </Group>
              </div>
            ))}
          </Stack>
        )}
      </Panel>
    </AdminPage>
  );
}