import {
  Badge,
  Skeleton,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPage, EmptyState, Panel, Th } from "@/components/admin-ui";
import { AnchorLink } from "@/components/anchor-link";
import { LinkButton } from "@/components/link-button";
import { ListSearch } from "@/components/list-search";
import { requireRole } from "@/lib/auth";
import { displayName, formatDay } from "@/lib/formats";
import { getSiteWorkers } from "@/lib/queries/site-workers";

export const metadata: Metadata = { title: "Workers" };

type PageProps = { searchParams: Promise<{ q?: string | string[] }> };

// The search text comes from the URL, which anyone can edit, so keep it to one short string.
function parseSearch(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").trim().slice(0, 100);
}

export default function SecretaryWorkersPage({ searchParams }: PageProps) {
  return (
    <AdminPage
      title="Workers"
      description="The workers registered on your site."
      back={{ href: "/secretary", label: "Dashboard" }}
      actions={<LinkButton href="/secretary/workers/new">Add worker</LinkButton>}
    >
      <Suspense fallback={<Skeleton height={360} radius="md" />}>
        <Workers searchParams={searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function Workers({ searchParams }: PageProps) {
  const user = await requireRole("secretary"); // check access before any query runs

  if (!user.siteId) {
    return (
      <Panel>
        <EmptyState
          title="No site assigned yet"
          text="Ask the engineer to assign you to a site. Until then you can't register workers."
        />
      </Panel>
    );
  }

  const { q } = await searchParams;
  const search = parseSearch(q);
  const rows = await getSiteWorkers(user.siteId, { search });

  return (
    <Panel
      title="Site workers"
      description={
        search
          ? `${rows.length} ${rows.length === 1 ? "match" : "matches"} for "${search}"`
          : `${rows.length} ${rows.length === 1 ? "worker" : "workers"}`
      }
      action={
        <ListSearch q={search} basePath="/secretary/workers" placeholder="Search name, trade or phone" />
      }
      flush
    >
      {rows.length === 0 ? (
        <EmptyState
          title={search ? "No workers match your search" : "No workers yet"}
          text={
            search
              ? "Try another name, trade or phone number."
              : "Use Add worker to register the people who work on your site. The foreman picks from this list when recording attendance."
          }
        />
      ) : (
        <TableScrollContainer minWidth={640}>
          <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
            <TableThead>
              <TableTr>
                <Th>Name</Th>
                <Th>Trade</Th>
                <Th>Phone</Th>
                <Th>Last on duty</Th>
                <Th />
              </TableTr>
            </TableThead>
            <TableTbody>
              {rows.map((w) => (
                <TableTr key={w.id}>
                  <TableTd>
                    <AnchorLink href={`/secretary/workers/${w.id}`} size="sm" fw={600}>
                      {displayName(w)}
                    </AnchorLink>
                  </TableTd>
                  <TableTd>
                    <Badge variant="light" tt="capitalize">
                      {w.trade}
                    </Badge>
                  </TableTd>
                  <TableTd>{w.phone || "—"}</TableTd>
                  <TableTd>
                    {w.lastWorked != null ? (
                      formatDay(new Date(w.lastWorked))
                    ) : (
                      <Text size="sm" c="dimmed">
                        Never
                      </Text>
                    )}
                  </TableTd>
                  <TableTd ta="right">
                    <LinkButton href={`/secretary/workers/${w.id}`} size="xs" variant="light">
                      View
                    </LinkButton>
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </TableScrollContainer>
      )}
    </Panel>
  );
}