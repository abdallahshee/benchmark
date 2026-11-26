import {
  Avatar,
  Badge,
  Box,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import type { ComponentProps, ReactNode } from "react";

import { AnchorLink } from "@/components/anchor-link";
import { TableTh } from "@mantine/core";

// ---------- Icons (inline, so no icon package is needed) ----------
const ICONS = {
  sites: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8l7-4 7 4v13" />
      <path d="M10 21v-5h4v5" />
      <path d="M9 11h.01M12 11h.01M15 11h.01" />
    </>
  ),
  reports: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.6c1.8.8 3 2.6 3 5.4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </>
  ),
  money: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10v.01M18 14v.01" />
    </>
  ),
  check: (
    <>
      <path d="M9 4h6v3H9z" />
      <path d="M7 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1" />
      <path d="M9 14l2 2 4-4" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13l3-8h12l3 8v6H3z" />
      <path d="M3 13h5l1 3h6l1-3h5" />
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export function AdminIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

// ---------- Page shell: header with title, description, back link and actions ----------
type AdminPageProps = {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPage({ title, description, back, actions, children }: AdminPageProps) {
  return (
    <Stack
      component="main"
      gap="lg"
      p={{ base: "md", sm: "xl" }}
      className="mx-auto w-full max-w-6xl flex-1"
    >
      {back && (
        <AnchorLink href={back.href} size="sm">
          ← {back.label}
        </AnchorLink>
      )}

      <Group justify="space-between" align="flex-end" gap="md">
        <Group gap="sm" align="center" wrap="nowrap">
          <span aria-hidden="true" className="h-10 w-1.5 shrink-0 rounded-full bg-amber-400" />
          <div>
            <Title order={1} size="h2" lh={1.2}>
              {title}
            </Title>
            {description && (
              <Text c="dimmed" size="sm" mt={2}>
                {description}
              </Text>
            )}
          </div>
        </Group>
        {actions}
      </Group>

      {children}
    </Stack>
  );
}

// ---------- Panel: a bordered card with an optional titled header ----------
type PanelProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  // Removes the body padding, for panels that hold a table.
  flush?: boolean;
  children: ReactNode;
};

export function Panel({ title, description, action, flush, children }: PanelProps) {
  return (
    <Paper withBorder radius="md" shadow="xs">
      {(title || action) && (
        <>
          <Group justify="space-between" align="center" px="lg" py="md" gap="md">
            <div>
              {title && (
                <Title order={2} size="h5">
                  {title}
                </Title>
              )}
              {description && (
                <Text size="sm" c="dimmed">
                  {description}
                </Text>
              )}
            </div>
            {action}
          </Group>
          <Divider />
        </>
      )}
      <Box p={flush ? 0 : "lg"}>{children}</Box>
    </Paper>
  );
}

// ---------- Stat card ----------
type StatCardProps = {
  label: string;
  value: string | number;
  icon: IconName;
  color?: string;
  valueColor?: string;
  href?: string;
  linkText?: string;
};

export function StatCard({ label, value, icon, color = "yellow", valueColor, href, linkText }: StatCardProps) {
  return (
    <Paper withBorder radius="md" shadow="xs" p="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase" lh={1.2}>
            {label}
          </Text>
          <Text fz={32} fw={700} lh={1.2} mt={6} c={valueColor}>
            {value}
          </Text>
        </div>
        <ThemeIcon variant="light" color={color} size={44} radius="md">
          <AdminIcon name={icon} size={22} />
        </ThemeIcon>
      </Group>
      {href && linkText && (
        <Box mt="sm">
          <AnchorLink href={href} size="sm">
            {linkText}
          </AnchorLink>
        </Box>
      )}
    </Paper>
  );
}

// ---------- Small pieces ----------
export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <Stack align="center" gap="xs" py="xl" px="md" ta="center">
      <ThemeIcon variant="light" color="gray" size={56} radius="xl">
        <AdminIcon name="inbox" size={26} />
      </ThemeIcon>
      <Text fw={600}>{title}</Text>
      {text && (
        <Text size="sm" c="dimmed" maw={360}>
          {text}
        </Text>
      )}
    </Stack>
  );
}

// A label above a value, for detail views.
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={600} tt="uppercase">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

// Table header cell with the shared style.
export function Th(props: ComponentProps<typeof TableTh>) {
  return <TableTh fz="xs" tt="uppercase" fw={600} c="dimmed" {...props} />;
}

export function initialsOf(p: { firstName: string | null; lastName: string | null }) {
  return (
    [p.firstName, p.lastName]
      .filter(Boolean)
      .map((n) => n!.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

export { Avatar };

// ---------- Status badges: one place for the colours ----------
const SITE_COLOR: Record<string, string> = {
  active: "green",
  on_hold: "yellow",
  completed: "blue",
  archived: "gray",
};
const REPORT_COLOR: Record<string, string> = {
  draft: "gray",
  submitted: "green",
  reopened: "yellow",
};

export function SiteStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="dot" size="md" color={SITE_COLOR[status] ?? "gray"} tt="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}

// export function ReportStatusBadge() {
//   return (
//     <Badge variant="dot" size="md" color={REPORT_COLOR[status] ?? "gray"} tt="capitalize">
//       {status}
//     </Badge>
//   );
// }