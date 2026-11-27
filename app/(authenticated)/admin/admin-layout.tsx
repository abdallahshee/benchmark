"use client";

import { BrandMark } from "@/components/brand-logo";
// import { BrandMark } from "@/app/page";
import { EngineerArt } from "@/components/engineer-art";
import { APP_NAME, ICONS, NavIcon } from "@/components/nav-icon";
import { SignOutButton } from "@/components/sign-out-button";
import { Role } from "@/types/user";
import { AppShell, Avatar, Badge, Burger, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";


// Small inline icons, so no icon package is needed.


export type NavItem = { label: string; href: string; icon: keyof typeof ICONS };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Sites", href: "/admin/sites", icon: "sites" },
  { label: "Reports", href: "/admin/reports", icon: "reports" },
  { label: "Users", href: "/admin/users", icon: "users" },
];

type AdminLayoutProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | undefined,
    role: Role
  };
  signOutAction: () => Promise<void>;
  children: ReactNode;
};





export function AdminLayout({ user, signOutAction, children }: AdminLayoutProps) {
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

  // const current = navItems.find((item) => isActive(item.href));
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Administrator";
  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n!.charAt(0).toUpperCase())
      .join("") || "A";

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
      styles={{
        header: {
          backgroundColor: "light-dark(#ffffff, #111827)",
          borderBottom: "1px solid light-dark(#e2e8f0, #263449)",
        },
        navbar: {
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          borderRight: "none",
        },
        main: {
          backgroundColor: "light-dark(#f1f5f9, #0b1120)",
          minHeight: "100vh",
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />

            <div className="flex items-center">
              <h2 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                Admin Console
              </h2>
            </div>
          </Group>

          <Group gap="md" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Avatar color="yellow" radius="xl">
                {initials}
              </Avatar>

              <Stack gap={0} visibleFrom="sm">
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {name}
                  </Text>
                </Group>

                <Text size="xs" c="dimmed">
                  {user.email}
                </Text>
              </Stack>
            </Group>
            <SignOutButton />
            {/* <form action={signOutAction}>
              <Button type="submit" variant="filled" color="red" size="sm">
                Sign out
              </Button>
            </form> */}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <div className="relative flex h-full flex-col overflow-hidden text-slate-200">
          {/* Blueprint grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 flex items-center gap-3 px-5 py-5">

            <BrandMark />
          </div>

          <nav aria-label="Admin" className="relative z-10 flex flex-col gap-1 px-3 pt-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                    ? "bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <EngineerArt />
        </div>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}