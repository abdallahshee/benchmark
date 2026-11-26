
import {
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
    ReportStatusBadge,
    StatCard,
} from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/formats";
import { ForemanDashboard, getForemanDashboard } from "./actions";

export const metadata: Metadata = {
    title: "Dashboard",
};

const TODAY_HREF = "/foreman/reports/new";

// Today's report summary and action.
function todaySummary(report: ForemanDashboard["today"]) {
    if (!report) {
        return {
            text: "You haven't started today's report yet.",
            cta: "Create today's report",
            href: TODAY_HREF,
        };
    }

    const view = `/foreman/reports/${report.id}`;

    switch (report.status) {
        case "submitted":
            return {
                text: "Your report has been submitted and is awaiting engineer review.",
                cta: "View report",
                href: view,
            };

        case "approved":
            return {
                text: "Your report has been approved by the engineer.",
                cta: "View report",
                href: view,
            };

        case "rejected":
            return {
                text: "Your report has been rejected. Please review the engineer's notes.",
                cta: "View report",
                href: view,
            };

        default:
            return {
                text: "View today's report.",
                cta: "View report",
                href: view,
            };
    }
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

    const { site, today, counts, recent } = data;
    const summary = todaySummary(today);

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
                        <ReportStatusBadge status={today.status} />
                    ) : undefined
                }
            >
                <Group
                    justify="space-between"
                    align="center"
                    gap="md"
                >
                    <Text c={today ? undefined : "dimmed"} maw={560}>
                        {summary.text}
                    </Text>

                    <LinkButton href={summary.href}>
                        {summary.cta}
                    </LinkButton>
                </Group>
            </Panel>

            {/* Report statistics */}
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <StatCard
                    label="Submitted"
                    value={counts.submitted}
                    icon="inbox"
                    color="blue"
                />

                <StatCard
                    label="Approved"
                    value={counts.approved}
                    icon="check"
                    color="green"
                />

                <StatCard
                    label="Rejected"
                    value={counts.rejected}
                    icon="reports"
                    color="red"
                />
            </SimpleGrid>

            {/* Recent reports */}
            <Panel
                title="Recent reports"
                description="Your site's five latest"
                action={
                    <LinkButton
                        href="/foreman/reports"
                        size="xs"
                        variant="light"
                    >
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
                                            {formatDate(r.reportDate)}
                                        </Text>

                                        <Text size="xs" c="dimmed">
                                            Created {formatDateTime(r.createdAt)}
                                        </Text>

                                        {r.status === "rejected" && r.notes && (
                                            <Text
                                                size="xs"
                                                c="red"
                                                mt={4}
                                            >
                                                Rejection notes: {r.notes}
                                            </Text>
                                        )}
                                    </div>

                                    <Group gap="sm" wrap="nowrap">
                                        <ReportStatusBadge
                                            status={r.status}
                                        />

                                        <LinkButton
                                            href={`/foreman/reports/${r.id}`}
                                            size="xs"
                                            variant="light"
                                        >
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
