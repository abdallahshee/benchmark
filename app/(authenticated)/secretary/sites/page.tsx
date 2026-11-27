
// import Link from "next/link";
import {
    Badge,
    Button,
    Card,
    Grid,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    ArrowRight,
    Building2,
    ClipboardList,
    MapPin,
    Users,
} from "lucide-react";

import { requireRole } from "@/lib/auth";
import { getSiteSummary } from "../../foreman/actions";
import { LinkButton } from "@/components/link-button";

export const metadata = {
    title: "My Site",
};

export default async function SecretarySitesPage() {
    const user = await requireRole("secretary");

    const site = user.siteId
        ? await getSiteSummary(user.siteId)
        : null;

    if (!site) {
        return (
            <Stack gap="lg">
                <div>
                    <Title order={2}>My Site</Title>
                    <Text c="dimmed" size="sm">
                        View information about your assigned construction site.
                    </Text>
                </div>

                <Paper withBorder radius="lg" p="xl">
                    <Stack align="center" gap="sm" py="xl">
                        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                            <Building2 size={30} />
                        </ThemeIcon>

                        <Title order={3} ta="center">
                            No site assigned
                        </Title>

                        <Text c="dimmed" size="sm" ta="center" maw={380}>
                            You haven't been assigned to a construction site yet.
                            Please contact your administrator for assistance.
                        </Text>
                    </Stack>
                </Paper>
            </Stack>
        );
    }

    return (
        <Stack gap="lg">
            {/* Page heading */}
            <div>
                <Title order={2}>My Site</Title>
                <Text c="dimmed" size="sm" mt={4}>
                    View your assigned construction site and access its information.
                </Text>
            </div>

            {/* Site overview */}
            <Card withBorder radius="lg" padding="lg">
                <Stack gap="lg">
                    <Group justify="space-between" align="flex-start">
                        <Group gap="md">
                            <ThemeIcon
                                size={54}
                                radius="md"
                                variant="light"
                                color="blue"
                            >
                                <Building2 size={27} />
                            </ThemeIcon>

                            <div>
                                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                                    Assigned construction site
                                </Text>

                                <Title order={3} mt={4}>
                                    {site.name}
                                </Title>
                            </div>
                        </Group>

                        <Badge color="blue" variant="light" size="lg">
                            My Site
                        </Badge>
                    </Group>

                    <Text size="sm" c="dimmed">
                        You are assigned to this site as a secretary. Use the
                        sections below to access site reports and personnel.
                    </Text>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <Paper withBorder radius="md" p="md">
                            <Group gap="sm">
                                <ThemeIcon variant="light" color="blue" radius="md">
                                    <ClipboardList size={20} />
                                </ThemeIcon>

                                <div>
                                    <Text fw={600} size="sm">
                                        Site reports
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        View and manage daily reports
                                    </Text>
                                </div>
                            </Group>
                        </Paper>

                        <Paper withBorder radius="md" p="md">
                            <Group gap="sm">
                                <ThemeIcon variant="light" color="teal" radius="md">
                                    <Users size={20} />
                                </ThemeIcon>

                                <div>
                                    <Text fw={600} size="sm">
                                        Site workers
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        View workers assigned to this site
                                    </Text>
                                </div>
                            </Group>
                        </Paper>
                    </SimpleGrid>
                </Stack>
            </Card>

            {/* Quick navigation */}
            <div>
                <Title order={4} mb="sm">
                    Site information
                </Title>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Card withBorder radius="lg" padding="lg">
                        <Stack gap="md">
                            <ThemeIcon color="blue" variant="light" size={42} radius="md">
                                <ClipboardList size={22} />
                            </ThemeIcon>

                            <div>
                                <Text fw={600}>Daily reports</Text>
                                <Text size="sm" c="dimmed" mt={4}>
                                    Access daily site reports and review submitted updates.
                                </Text>
                            </div>

                            <LinkButton
                                // component={Link}
                                href="/secretary/reports"
                                variant="light"
                                rightSection={<ArrowRight size={16} />}
                                fullWidth
                                mt="auto"
                            >
                                View reports
                            </LinkButton>
                        </Stack>
                    </Card>

                    <Card withBorder radius="lg" padding="lg">
                        <Stack gap="md">
                            <ThemeIcon color="teal" variant="light" size={42} radius="md">
                                <Users size={22} />
                            </ThemeIcon>

                            <div>
                                <Text fw={600}>Workers</Text>
                                <Text size="sm" c="dimmed" mt={4}>
                                    View the workers assigned to your construction site.
                                </Text>
                            </div>

                            <LinkButton
                                // component={Link}
                                href="/secretary/workers"
                                variant="light"
                                color="teal"
                                rightSection={<ArrowRight size={16} />}
                                fullWidth
                                mt="auto"
                            >
                                View workers
                            </LinkButton>
                        </Stack>
                    </Card>
                </SimpleGrid>
            </div>
        </Stack>
    );
}
