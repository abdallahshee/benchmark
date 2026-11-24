import { ICONS } from "@/components/nav-icon";

export type RoleNavItem = { label: string; href: string; icon: keyof typeof ICONS };

export const ROLE_HOME_PATHS = {
    admin: "/admin",
    foreman: "/foreman",
    secretary: "/secretary",
    worker: "/worker",
} as const;