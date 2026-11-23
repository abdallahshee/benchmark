import {
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";

import Link from "next/link";
import { Building2, FileText, Users } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number;
  href: string;
  linkText: string;
  icon: "sites" | "reports" | "users";
  color: string;
};

const icons = {
  sites: Building2,
  reports: FileText,
  users: Users,
};

export function DefinedStatCard({
  label,
  value,
  href,
  linkText,
  icon,
  color,
}: StatCardProps) {
  const Icon = icons[icon];

  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {label}
          </Text>

          <Text size="xl" fw={700}>
            {value}
          </Text>
        </Stack>

        <ThemeIcon size={48} radius="md" variant="light" color={color}>
          <Icon size={24} strokeWidth={1.8} />
        </ThemeIcon>
      </Group>

      <Link
        href={href}
        style={{
          display: "inline-block",
          marginTop: "16px",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--mantine-color-blue-6)",
          textDecoration: "none",
        }}
      >
        {linkText}
      </Link>
    </Card>
  );
}