"use client";

import { AppShell, Avatar, Badge, Burger, Button, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Change this to your product's name.
const APP_NAME = "Benchmark";

// Small inline icons, so no icon package is needed.
const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.6c1.8.8 3 2.6 3 5.4" />
    </>
  ),
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
};

export type NavItem = { label: string; href: string; icon: keyof typeof ICONS };

const navItems: NavItem[] = [
  // { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Sites", href: "/admin/sites", icon: "sites" },
  { label: "Reports", href: "/admin/reports", icon: "reports" },
  { label: "Users", href: "/admin/users", icon: "users" },
];

type AdminLayoutProps = {
  user: { firstName: string | null; lastName: string | null; email: string | undefined };
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

function NavIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
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

// Decorative tower crane and skyline. Hidden from screen readers.
function CraneArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 250 190"
      className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-90"
    >
      <g fill="#1e293b">
        <rect x="0" y="130" width="46" height="60" />
        <rect x="54" y="105" width="36" height="85" />
        <rect x="150" y="120" width="44" height="70" />
        <rect x="202" y="142" width="48" height="48" />
      </g>
      <g stroke="#fbbf24" fill="none" strokeLinecap="round" opacity="0.6">
        <rect x="108" y="30" width="7" height="160" strokeWidth="2.5" />
        <line x1="40" y1="34" x2="236" y2="34" strokeWidth="4" />
        <polyline points="40,34 112,10 236,34" strokeWidth="1.5" />
        <rect x="40" y="34" width="20" height="14" strokeWidth="2.5" />
        <line x1="200" y1="34" x2="200" y2="96" strokeWidth="1.5" />
        <circle cx="200" cy="100" r="3.5" strokeWidth="1.5" />
        <rect x="188" y="104" width="24" height="15" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

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

  const current = navItems.find((item) => isActive(item.href));
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
                Admin
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

            <form action={signOutAction}>
              <Button type="submit" variant="default" size="xs">
                Sign out
              </Button>
            </form>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-lg font-extrabold text-slate-900">
              {APP_NAME.charAt(0)}
            </div>
            <div>
              <p className="text-base font-semibold leading-tight text-white">{APP_NAME}</p>
              <p className="text-[11px] font-semibold uppercase leading-tight tracking-widest text-amber-400">
                Site management
              </p>
            </div>
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

          <CraneArt />
        </div>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}