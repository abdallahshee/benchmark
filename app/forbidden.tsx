
import { Box, Button, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { ArrowLeft, Home, LockKeyhole } from "lucide-react";

import { AnchorLink } from "@/components/anchor-link";

export default function Forbidden() {
  return (
    <Stack
      component="main"
      align="center"
      justify="center"
      className="flex-1"
      px="md"
      py={60}
    >
      <Paper
        withBorder
        shadow="md"
        radius="lg"
        p={{ base: "xl", sm: 48 }}
        maw={480}
        w="100%"
      >
        <Stack align="center" gap="lg">
          <ThemeIcon
            size={80}
            radius="xl"
            variant="light"
            color="red"
          >
           <LockKeyhole size={40} strokeWidth={1.5} />
          </ThemeIcon>

          <Stack align="center" gap={4}>
            <Text
              size="sm"
              fw={700}
              c="red"
              tt="uppercase"
              style={{ letterSpacing: 2 }}
            >
              Error 403
            </Text>

            <Title order={2} ta="center">
              Access denied
            </Title>
          </Stack>

          <Text c="dimmed" ta="center" size="sm" maw={340}>
            You don&apos;t have the required permissions to access this page.
            If you believe this is a mistake, please contact your administrator.
          </Text>

          <Box w="100%" pt="sm">
            <Stack gap="sm">
              <Button
                component="a"
                href="/"
                leftSection={<Home size={17} />}
                fullWidth
              >
                Return to Home
              </Button>

              <AnchorLink href="/dashboard">
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<ArrowLeft size={17} />}
                  fullWidth
                >
                  Go to Dashboard
                </Button>
              </AnchorLink>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Text size="xs" c="dimmed">
        Protected area · Unauthorized access is restricted
      </Text>
    </Stack>
  );
}
