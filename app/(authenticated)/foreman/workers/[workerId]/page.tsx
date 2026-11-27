import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stack, Text, Title } from "@mantine/core";

import { WorkerDetails } from "@/components/workers/worker-details";
import { getWorkerById } from "@/lib/workers";

export const metadata: Metadata = {
  title: "Worker Details",
};

type PageProps = {
  params: Promise<{
    workerId: string;
  }>;
};

const Page = async ({ params }: PageProps) => {
  const { workerId } = await params;

  const worker = await getWorkerById(workerId);

  if (!worker) {
    notFound();
  }

  return (
    <Stack gap="lg" className="w-full flex-1">
      <Stack gap={4}>
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