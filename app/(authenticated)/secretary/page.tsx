import { Badge, Divider, Group, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel, StatCard } from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { displayName, formatDateTime, formatDay, formatMoney } from "@/lib/formats";
import { getSecretaryDashboard, type SecretaryDashboard } from "@/lib/queries/secretary";

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
function todaySummary(today: SecretaryDashboard["today"]) {
  if (!today) {
    return { text: "The foreman hasn't submitted today's report yet.", cta: null, href: "" };
  }
  return {
    text: `The foreman submitted today's report on ${formatDateTime(today.createdAt)}.`,
    cta: "View report",
    href: `/secretary/reports/${today.id}`,
  };
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
            text="Ask the engineer to assign you to a site. Until then you can't see reports."
          />
        </Panel>
      </AdminPage>
    );
  }

  const { site, today, total, thisMonth, recent } = data;
  const summary = todaySummary(today);
  const latest = recent[0];

  return (
    <AdminPage
      title={`Welcome, ${user.firstName || "Secretary"}`}
      description={`Site: ${site.name}`}
    >
      <Panel
        title="Today's report"
        description="One report per site, every day"
        action={
          today ? (
            <Badge variant="dot" color="green">
              Submitted
            </Badge>
          ) : undefined
        }
      >
        <Group justify="space-between" align="center" gap="md">
          <Text c={today ? undefined : "dimmed"} maw={560}>
            {summary.text}
          </Text>
          {summary.cta && <LinkButton href={summary.href}>{summary.cta}</LinkButton>}
        </Group>
      </Panel>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <StatCard label="Reports submitted" value={total} icon="reports" color="blue" />
        <StatCard label="This month" value={thisMonth} icon="inbox" color="yellow" />
        <StatCard
          label="Last report"
          value={latest ? formatDay(latest.createdAt) : "None yet"}
          icon="check"
          color="green"
        />
      </SimpleGrid>

      <Panel
        title="Recent reports"
        description="Your site's five latest"
        action={
          <LinkButton href="/secretary/reports" size="xs" variant="light">
            All reports
          </LinkButton>
        }
        flush
      >
        {recent.length === 0 ? (
          <EmptyState
            title="No reports yet"
            text="Reports appear here as soon as the foreman submits them."
          />
        ) : (
          <Stack gap={0}>
            {recent.map((r, i) => (
              <div key={r.id}>
                {i > 0 && <Divider />}
                <Group justify="space-between" px="lg" py="sm" wrap="nowrap" align="center">
                  <div>
                    <Text fw={600} size="sm">
                      {formatDay(r.createdAt)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {displayName({
                        firstName: r.creatorFirstName,
                        lastName: r.creatorLastName,
                      })}
                      {` · submitted ${formatDateTime(r.createdAt)}`}
                    </Text>
                  </div>
                  <Group gap="md" wrap="nowrap">
                    <Text size="sm" c="dimmed" visibleFrom="xs">
                      Materials {formatMoney(r.materialsCost)}
                    </Text>
                    <LinkButton href={`/secretary/reports/${r.id}`} size="xs" variant="light">
                      View
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