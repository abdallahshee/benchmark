
import {
  Anchor,
  Button,
  Divider,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  AdminPage,
  Avatar,
  Field,
  Panel,
  SiteStatusBadge,
  initialsOf,
} from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { SiteStaffActions } from "@/components/sites/staff-actions";
import { SiteWorkers } from "@/components/workers/site-workers";
import { requireRole } from "@/lib/auth";
import { displayName, formatDateTime, formatDay } from "@/lib/formats";
import { getWorkersBySiteId } from "@/lib/workers";

import {
  getForemanBySiteId,
  getReportsBySiteId,
  getSiteById,
} from "./action";
import { getSecretaryBySiteId } from "../actions";

export const metadata: Metadata = {
  title: "Site details",
};

type PageProps = {
  params: Promise<{ siteId: string }>;
};

type Person = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
};

function PersonPanel({
  roleLabel,
  person,
}: {
  roleLabel: "Foreman" | "Secretary";
  person: Person | null;
}) {
  const role = roleLabel.toLowerCase();

  return (
    <Panel title={roleLabel}>
      {person ? (
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap">
            <Avatar color="yellow" radius="xl" size="lg">
              {initialsOf(person)}
            </Avatar>

            <div>
              <Text fw={600}>{displayName(person)}</Text>
              <Text size="sm" c="dimmed">
                Site {role}
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
            <Field label="Phone">
              {person.phone ? (
                <Anchor href={`tel:${person.phone}`} size="sm">
                  {person.phone}
                </Anchor>
              ) : (
                <Text size="sm">—</Text>
              )}
            </Field>

            <Field label="Email">
              {person.email ? (
                <Anchor href={`mailto:${person.email}`} size="sm">
                  {person.email}
                </Anchor>
              ) : (
                <Text size="sm">—</Text>
              )}
            </Field>
          </SimpleGrid>

          <Text size="xs" c="dimmed">
            This position is filled. A site can have only one {role}.
          </Text>
        </Stack>
      ) : (
        <Text c="dimmed">
          No {role} is assigned to this site yet.
        </Text>
      )}
    </Panel>
  );
}

export default function SiteDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage
          title="Site"
          back={{ href: "/admin/sites", label: "Sites" }}
        >
          <Stack gap="lg">
            <Skeleton height={120} radius="md" />
            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <Skeleton height={180} radius="md" />
              <Skeleton height={180} radius="md" />
            </SimpleGrid>
            <Skeleton height={220} radius="md" />
            <Skeleton height={400} radius="md" />
          </Stack>
        </AdminPage>
      }
    >
      <SiteDetails params={params} />
    </Suspense>
  );
}

async function SiteDetails({ params }: PageProps) {
  const user = await requireRole("admin");
  const { siteId } = await params;

  const [site, foreman, secretary, latest, workers] = await Promise.all([
    getSiteById(siteId),
    getForemanBySiteId(siteId),
    getSecretaryBySiteId(siteId),
    getReportsBySiteId(siteId, 3),
    getWorkersBySiteId(siteId),
  ]);

  if (!site) {
    notFound();
  }

  return (
    <AdminPage
      title={site.name}
      description="Site team and latest reports"
      back={{ href: "/admin/sites", label: "Sites" }}
      actions={
        <Group gap="sm">
          <SiteStatusBadge status={site.status} />
          {/* <LinkButton href={`/admin/sites/${site.id}/users`}>
            Users
          </LinkButton> */}
        </Group>
      }
    >
      {/* Site foreman and secretary */}
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <PersonPanel roleLabel="Foreman" person={foreman} />
        <PersonPanel roleLabel="Secretary" person={secretary} />
      </SimpleGrid>

      {/* Invitation actions */}
      <SiteStaffActions
        siteId={site.id}
        hasForeman={Boolean(foreman)}
        hasSecretary={Boolean(secretary)}
      />

      {/* Latest reports */}
      <Panel
        title="Latest reports"
        description="The three most recent"
        action={
          <LinkButton
            href={`/admin/sites/${site.id}/reports`}
            size="xs"
            variant="light"
          >
            All reports
          </LinkButton>
        }
        flush
      >
        {latest.length === 0 ? (
          <Text c="dimmed" p="lg">
            No reports have been recorded for this site yet.
          </Text>
        ) : (
          <Stack gap={0}>
            {latest.map((report, index) => (
              <div key={report.id}>
                {index > 0 && <Divider />}

                <Group
                  justify="space-between"
                  px="lg"
                  py="sm"
                  wrap="nowrap"
                >
                  <div>
                    <Text fw={600} size="sm">
                      {formatDay(report.createdAt)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Submitted {formatDateTime(report.createdAt)}
                    </Text>
                  </div>

                  <Group gap="xs" wrap="nowrap">
                    <Button
                      component="a"
                      href={`/api/reports/${report.id}/pdf`}
                      size="xs"
                      variant="default"
                    >
                      PDF
                    </Button>

                    <LinkButton
                      href={`/admin/reports/${report.id}`}
                      size="xs"
                      variant="light"
                    >
                      Read
                    </LinkButton>
                  </Group>
                </Group>
              </div>
            ))}
          </Stack>
        )}
      </Panel>

      {/* Workers assigned to this site */}
      <SiteWorkers
        workers={workers}
        user={user}
        title="Site workers"
        description="All workers assigned to this construction site"
      />
    </AdminPage>
  );
}
