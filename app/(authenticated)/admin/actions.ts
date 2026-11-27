
import "server-only";

import { asc, count, desc, eq, isNull, ne, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { profiles, reports, sites } from "@/db/schema";
import { TZ } from "@/lib/helper";

// Nairobi timezone.


const LATEST_REPORTS = 8;
const ROLELESS_SHOWN = 5;

// Everyone except admins, including users without an assigned role.
const notAdmin = or(isNull(profiles.role), ne(profiles.role, "admin"));

export async function getDashboardData() {
    // Check whether each active site has submitted a report today.
    const reportedToday = sql<boolean>`exists (
        select 1
        from ${reports} r
        where r.site_id = ${sites}.id
        and (r.created_at at time zone ${TZ})::date =
            (now() at time zone ${TZ})::date
    )`;

    const hasForeman = sql<boolean>`exists (
        select 1
        from ${profiles} p
        where p.site_id = ${sites}.id
        and p.role = 'foreman'
    )`;

    const hasSecretary = sql<boolean>`exists (
        select 1
        from ${profiles} p
        where p.site_id = ${sites}.id
        and p.role = 'secretary'
    )`;

    const [
        [{ siteCount }],
        [{ reportCount }],
        [{ userCount }],
        activeSites,
        latestReports,
        usersWithoutRole,
        [{ usersWithoutRoleCount }],
    ] = await Promise.all([
        db.select({ siteCount: count() }).from(sites),

        db.select({ reportCount: count() }).from(reports),

        db.select({ userCount: count() })
            .from(profiles)
            .where(notAdmin),

        // Active sites and their reporting/staffing status.
        db
            .select({
                id: sites.id,
                name: sites.name,
                reportedToday,
                hasForeman,
                hasSecretary,
            })
            .from(sites)
            .where(eq(sites.status, "active"))
            .orderBy(asc(sites.name)),

        // Latest reports.
        db
            .select({
                id: reports.id,
                // status: reports.status,
                createdAt: reports.createdAt,
                siteName: sites.name,
                creatorFirstName: profiles.firstName,
                creatorLastName: profiles.lastName,
            })
            .from(reports)
            .innerJoin(sites, eq(sites.id, reports.siteId))
            .leftJoin(profiles, eq(profiles.id, reports.createdBy))
            .orderBy(desc(reports.createdAt))
            .limit(LATEST_REPORTS),

        // Users who have not been assigned a role.
        db
            .select({
                id: profiles.id,
                firstName: profiles.firstName,
                lastName: profiles.lastName,
                email: sql<string | null>`(
                    select u.email
                    from auth.users u
                    where u.id = ${profiles.id}
                )`,
            })
            .from(profiles)
            .where(isNull(profiles.role))
            .orderBy(desc(profiles.createdAt))
            .limit(ROLELESS_SHOWN),

        db
            .select({ usersWithoutRoleCount: count() })
            .from(profiles)
            .where(isNull(profiles.role)),
    ]);

    const notReported = activeSites
        .filter((site) => !site.reportedToday)
        .map(({ id, name }) => ({ id, name }));

    const sitesMissingStaff = activeSites
        .filter((site) => !site.hasForeman || !site.hasSecretary)
        .map((site) => ({
            id: site.id,
            name: site.name,
            missingForeman: !site.hasForeman,
            missingSecretary: !site.hasSecretary,
        }));

    return {
        siteCount,
        reportCount,
        userCount,

        today: {
            activeSiteCount: activeSites.length,
            reportedCount: activeSites.length - notReported.length,
            notReported,
        },

        latestReports,

        setup: {
            sitesMissingStaff,
            usersWithoutRole,
            usersWithoutRoleCount,
        },
    };
}

export type DashboardData = Awaited<
    ReturnType<typeof getDashboardData>
>;
