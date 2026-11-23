// The roles that can be added to a site. A site has at most one of each.
export const SITE_ROLES = ["foreman", "secretary"] as const;
export type SiteRole = (typeof SITE_ROLES)[number];