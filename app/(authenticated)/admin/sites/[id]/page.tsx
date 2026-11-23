import { Anchor, Divider, Group, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  AdminPage,
  Avatar,
  Field,
  Panel,
  ReportStatusBadge,
  SiteStatusBadge,
  initialsOf,
} from "@/components/admin-ui";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/auth";
import { displayName, formatDate, formatDateTime } from "@/lib/formats";
import {
  getForemanBySiteId,
  getReportsBySiteId,
  getSiteById,
} from "./action";
import { getSecretaryBySiteId } from "../actions";

export const metadata: Metadata = { title: "Site details" };

type PageProps = { params: Promise<{ id: string }> };

type Person = { firstName: string; lastName: string; phone: string; email: string | null };

export default function SiteDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AdminPage title="Site" back={{ href: "/admin/sites", label: "Sites" }}>
          <Skeleton height={400} radius="md" />
        </AdminPage>
      }
    >
      <SiteDetails params={params} />
    </Suspense>
  );
}

// One staff member's card, or a prompt to add one when the position is empty.
// One staff member's card. An empty position offers an Add button; a filled one says
// why no more can be added.
function PersonPanel({
  roleLabel,
  person,
  addHref,
}: {
  roleLabel: string;
  person: Person | null;
  addHref: string;
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
        <Stack gap="xs" align="flex-start">
          <Text c="dimmed">No {role} is assigned to this site yet.</Text>
          <LinkButton href={addHref} size="xs" variant="light">
            Add {role}
          </LinkButton>
        </Stack>
      )}
    </Panel>
  );
}

async function SiteDetails({ params }: PageProps) {
  await requireRole("admin"); // check access before any query runs

  const { id } = await params;
  const [site, foreman, secretary, latest] = await Promise.all([
    getSiteById(id),
    getForemanBySiteId(id),
    getSecretaryBySiteId(id),
    getReportsBySiteId(id, 3),
  ]);
  if (!site) notFound();

  return (
    <AdminPage
      title={site.name}
      description="Site team and latest reports"
      back={{ href: "/admin/sites", label: "Sites" }}
      actions={
        <Group gap="sm">
          <SiteStatusBadge status={site.status} />
          <LinkButton href={`/admin/sites/${site.id}/users`}>Users</LinkButton>
        </Group>
      }
    >
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <PersonPanel
          roleLabel="Foreman"
          person={foreman}
          addHref={`/admin/sites/${site.id}/users/new`}
        />
        <PersonPanel
          roleLabel="Secretary"
          person={secretary}
          addHref={`/admin/sites/${site.id}/users/new`}
        />
      </SimpleGrid>

      <Panel
        title="Latest reports"
        description="The three most recent"
        action={
          <LinkButton href={`/admin/sites/${site.id}/reports`} size="xs" variant="light">
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
            {latest.map((r, i) => (
              <div key={r.id}>
                {i > 0 && <Divider />}
                <Group justify="space-between" px="lg" py="sm" wrap="nowrap">
                  <div>
                    <Text fw={600} size="sm">
                      {formatDate(r.createdAt)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Created {formatDateTime(r.createdAt)}
                    </Text>
                  </div>
                  <Group gap="sm" wrap="nowrap">
                    <ReportStatusBadge status={r.status} />
                    <LinkButton href={`/admin/reports/${r.id}`} size="xs" variant="light">
                      Read
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