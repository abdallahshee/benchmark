import { Stack, Text, Title } from "@mantine/core";

import { AnchorLink } from "@/components/anchor-link";

export default function Forbidden() {
  return (
    <Stack component="main" align="center" justify="center" className="flex-1" p="xl">
      <Title order={1}>Access denied</Title>
      <Text c="dimmed">You don&apos;t have permission to view this page.</Text>
      <AnchorLink href="/account">
        Go to your account
      </AnchorLink>
    </Stack>
  );
}
