import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stack, Text, Title } from "@mantine/core";

import { AnchorLink } from "@/components/anchor-link";
import { WorkerDetails } from "@/components/workers/worker-details";
import { getWorkerById } from "@/lib/workers";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Worker Details",
};

type PageProps = {
  params: Promise<{
    workerId: string;
  }>;
};

const Page = async ({ params }: PageProps) => {
  await requireRole("secretary");

  const { workerId } = await params;

  const worker = await getWorkerById(workerId);

  if (!worker) {
    notFound();
  }

  return (
    <Stack gap="lg" className="w-full flex-1">
      <Stack gap={4}>
        <AnchorLink href="/secretary/workers" size="sm">
          ← Back to workers
        </AnchorLink>

        <Title order={2}>Worker details</Title>

        <Text size="sm" c="dimmed">
          View worker information and assigned construction sites.
        </Text>
      </Stack>

      <WorkerDetails worker={worker} />
    </Stack>
  );
};

export default Page;