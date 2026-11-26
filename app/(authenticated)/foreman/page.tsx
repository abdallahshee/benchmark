import {
    Badge,
    Divider,
    Group,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
} from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import {
    AdminPage,
    EmptyState,
    Panel,
    StatCard,
} from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { formatDateTime, formatDay } from "@/lib/formats";
import { ForemanDashboard, getForemanDashboard } from "./actions";

export const metadata: Metadata = {
    title: "Dashboard",
};

const TODAY_HREF = "/foreman/reports/new";

// Today's report summary and action.
function todaySummary(today: ForemanDashboard["today"]) {
    if (!today) {
        return {
            text: "You haven't submitted today's report yet.",
            cta: "Create today's report",
            href: TODAY_HREF,
        };
    }

    return {
        text: `You submitted today's report on ${formatDateTime(today.createdAt)}.`,
        cta: "View report",
        href: `/foreman/reports/${today.id}`,
    };
}

export default function ForemanDashboardPage() {
    return (
        <Suspense
            fallback={
                <AdminPage title="Dashboard">
                    <Skeleton height={360} radius="md" />
                </AdminPage>
            }
        >
            <ForemanDashboardContent />
        </Suspense>
    );
}

async function ForemanDashboardContent() {
    const user = await requireRole("foreman");

    const data = user.siteId
        ? await getForemanDashboard(user.siteId)
        : null;

    if (!data?.site) {
        return (
            <AdminPage title={`Welcome, ${user.firstName || "Foreman"}`}>
                <Panel>
                    <EmptyState
                        title="No site assigned yet"
                        text="Ask the engineer to assign you to a site. Until then you can't record reports."
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
            title={`Welcome, ${user.firstName || "Foreman"}`}
            description={`Site: ${site.name}`}
        >
            {/* Today's report */}
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

                    <LinkButton href={summary.href}>{summary.cta}</LinkButton>
                </Group>
            </Panel>

            {/* Report statistics */}
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <StatCard
                    label="Reports submitted"
                    value={total}
                    icon="reports"
                    color="blue"
                />

                <StatCard
                    label="This month"
                    value={thisMonth}
                    icon="inbox"
                    color="yellow"
                />

                <StatCard
                    label="Last report"
                    value={latest ? formatDay(latest.createdAt) : "None yet"}
                    icon="check"
                    color="green"
                />
            </SimpleGrid>

            {/* Recent reports */}
            <Panel
                title="Recent reports"
                description="Your site's five latest"
                action={
                    <LinkButton href="/foreman/reports" size="xs" variant="light">
                        All reports
                    </LinkButton>
                }
                flush
            >
                {recent.length === 0 ? (
                    <EmptyState
                        title="No reports yet"
                        text="Your first report will appear here once you submit it."
                    />
                ) : (
                    <Stack gap={0}>
                        {recent.map((r, i) => (
                            <div key={r.id}>
                                {i > 0 && <Divider />}

                                <Group
                                    justify="space-between"
                                    px="lg"
                                    py="sm"
                                    wrap="nowrap"
                                    align="flex-start"
                                >
                                    <div>
                                        <Text fw={600} size="sm">
                                            {formatDay(r.createdAt)}
                                        </Text>

                                        <Text size="xs" c="dimmed">
                                            Submitted {formatDateTime(r.createdAt)}
                                        </Text>

                                        {r.notes && (
                                            <Text size="xs" c="dimmed" mt={4} lineClamp={1} maw={420}>
                                                {r.notes}
                                            </Text>
                                        )}
                                    </div>

                                    <LinkButton
                                        href={`/foreman/reports/${r.id}`}
                                        size="xs"
                                        variant="light"
                                    >
                                        View
                                    </LinkButton>
                                </Group>
                            </div>
                        ))}
                    </Stack>
                )}
            </Panel>
        </AdminPage>
    );
}