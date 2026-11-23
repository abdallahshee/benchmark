"use client";

import { requireRole } from "@/lib/auth";
import { AppShell, Burger, Button, Group, NavLink, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { label: string; href: string };

type AdminLayoutProps = {
  user: { firstName: string | null; lastName: string | null; email: string | undefined };
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Sites", href: "/admin/sites" },
  { label: "Reports", href: "/admin/reports" },
];

export function AdminLayout({ user,signOutAction, children }: AdminLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();


  // Exact match for the section root, prefix match for deeper pages,
  // unless a more specific nav item matches better.
  const isActive = (href: string) =>
    pathname === href ||
    (pathname.startsWith(href + "/") &&
      !navItems.some(
        (o) => o.href !== href && o.href.startsWith(href + "/") && pathname.startsWith(o.href),
      ));

  return (
    // <AppShell
    //   header={{ height: 60 }}
    //   navbar={{ width: 250, breakpoint: "sm", collapsed: { mobile: !opened } }}
    //   padding="md"
    // >

    <AppShell
  header={{ height: 60 }}
  navbar={{ width: 250, breakpoint: "sm", collapsed: { mobile: !opened } }}
  padding="md"
  styles={{
    root: {
      backgroundColor: "#ffffff",
      color: "#171717",
    },
    header: {
      backgroundColor: "#ffffff",
      color: "#171717",
      borderBottom: "1px solid #e5e7eb",
    },
    navbar: {
      backgroundColor: "#ffffff",
      color: "#171717",
      borderRight: "1px solid #e5e7eb",
    },
    main: {
      backgroundColor: "#f8fafc",
      color: "#171717",
      minHeight: "100vh",
    },
  }}
>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
            {/* <Title order={4} c="var(--mantine-primary-color-filled)"> */}
             <Title order={4} >
              Admin
            </Title>
          </Group>

          <Group gap="md">
            <Stack gap={0} visibleFrom="xs">
              <Text size="sm" fw={500} ta="right">
                {user.firstName ?? "User"}
              </Text>
              <Text size="xs" c="dimmed" ta="right">
                {user.email}
              </Text>
            </Stack>
            <form action={signOutAction}>
              <Button type="submit" variant="default" size="xs">
                Sign out
              </Button>
            </form>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              variant="light"
              active={isActive(item.href)}
              onClick={close}
              styles={{ label: { fontWeight: 500 } }}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      
            {/* <AppShell.Main bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))"> */}

      <AppShell.Main >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}