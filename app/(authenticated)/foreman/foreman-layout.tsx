"use client";

import { BrandMark } from "@/components/brand-logo";
import { EngineerArt } from "@/components/engineer-art";
import { APP_NAME, ICONS, NavIcon } from "@/components/nav-icon";
import { SignOutButton } from "@/components/sign-out-button";
import type { Role } from "@/types/user";
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type RoleNavItem = {
  label: string;
  href: string;
  icon: keyof typeof ICONS;
};

type RoleLayoutProps = {
  roleBadge: string;
  homeHref: string;
  navItems: RoleNavItem[];
  user: {
    firstName: string;
    lastName: string;
    email: string | undefined;
    role: Role;
  };
  siteName: string | null;
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

export function RoleLayout({
  roleBadge,
  homeHref,
  navItems,
  user,
  siteName,
  signOutAction,
  children,
}: RoleLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === homeHref
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const name = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        header: {
          backgroundColor: "light-dark(#ffffff, #111827)",
          borderBottom: "1px solid light-dark(#e5e7eb, #1f2937)",
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
                {roleBadge} Console
              </h2>
            </div>
          </Group>

          <Group gap="md" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Avatar color="yellow" radius="xl">
                {initials || "U"}
              </Avatar>

              <Stack gap={0} visibleFrom="sm">
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {name || "User"}
                  </Text>

                  <Text size="xs" c="dimmed">
                    {roleBadge}
                  </Text>
                </Group>

                <Text size="xs" c="dimmed">
                  {user.email}
                </Text>
              </Stack>
            </Group>

            <SignOutButton />
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

          <nav
            aria-label={`${roleBadge} navigation`}
            className="relative z-10 flex flex-col gap-1 px-3 pt-2"
          >
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

          <div className="relative z-10 mx-3 mt-6 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Your site
            </p>

            <p className="mt-1 text-sm font-medium text-white">
              {siteName ?? "No site assigned"}
            </p>
          </div>

          <EngineerArt />
        </div>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}