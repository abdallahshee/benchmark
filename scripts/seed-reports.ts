
import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "../db/seed-client";
import {
    profiles,
    reports,
    materials,
    machineries,
} from "@/db/schema";

const REPORT_DATES = [
    new Date("2026-11-24T05:00:00.000Z"),
    new Date("2026-11-25T05:00:00.000Z"),
    new Date("2026-11-26T05:00:00.000Z"),
];

const REPORT_DATA = [
    {
        notes:
            "Foundation excavation and ground preparation progressed well. Concrete blinding was completed in the designated sections. Materials were delivered and stored safely. Work is progressing according to schedule.",

        materials: [
            { name: "Cement", quantity: "80", unit: "bags", unitCost: "750" },
            { name: "Building Sand", quantity: "12", unit: "tonnes", unitCost: "2800" },
            { name: "Ballast", quantity: "15", unit: "tonnes", unitCost: "3200" },
            { name: "Reinforcement Bars", quantity: "120", unit: "pieces", unitCost: "850" },
        ],

        machineries: [
            { category: "Excavator", number: 1, hours: "7.50" },
            { category: "Tipper Truck", number: 2, hours: "6.00" },
            { category: "Concrete Mixer", number: 1, hours: "5.00" },
        ],
    },

    {
        notes:
            "Foundation reinforcement and formwork installation continued. Concrete pouring was completed in several foundation sections. The team maintained the required quality standards, and materials were available throughout the working day.",

        materials: [
            { name: "Cement", quantity: "100", unit: "bags", unitCost: "750" },
            { name: "Building Sand", quantity: "8", unit: "tonnes", unitCost: "2800" },
            { name: "Ballast", quantity: "18", unit: "tonnes", unitCost: "3200" },
            { name: "Binding Wire", quantity: "25", unit: "kg", unitCost: "180" },
        ],

        machineries: [
            { category: "Concrete Mixer", number: 2, hours: "6.50" },
            { category: "Poker Vibrator", number: 2, hours: "4.00" },
            { category: "Tipper Truck", number: 1, hours: "5.00" },
        ],
    },

    {
        notes:
            "Blockwork activities commenced on the completed foundation sections. Masonry work progressed steadily, with the construction team maintaining proper alignment and mortar consistency. Site supervision and material checks were carried out.",

        materials: [
            { name: "Cement", quantity: "65", unit: "bags", unitCost: "750" },
            { name: "Building Blocks", quantity: "850", unit: "pieces", unitCost: "65" },
            { name: "Building Sand", quantity: "10", unit: "tonnes", unitCost: "2800" },
            { name: "Water", quantity: "5000", unit: "litres", unitCost: "5" },
        ],

        machineries: [
            { category: "Concrete Mixer", number: 1, hours: "5.00" },
            { category: "Tipper Truck", number: 1, hours: "3.50" },
            { category: "Water Pump", number: 1, hours: "4.00" },
        ],
    },
];

export async function seedReports(): Promise<void> {
    console.log("\n--- SEEDING REPORTS ---\n");

    await db.transaction(async (tx) => {
        const [foreman] = await tx
            .select({
                id: profiles.id,
                siteId: profiles.siteId,
            })
            .from(profiles)
            .where(
                and(
                    eq(profiles.role, "foreman"),
                    isNotNull(profiles.siteId),
                ),
            )
            .limit(1);

        if (!foreman?.siteId) {
            throw new Error(
                "No foreman assigned to a site was found.",
            );
        }

        console.log(`Using foreman: ${foreman.id}`);
        console.log(`Using site: ${foreman.siteId}`);

        let insertedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < REPORT_DATA.length; i++) {
            const reportData = REPORT_DATA[i];
            const reportDate = REPORT_DATES[i];

            const [report] = await tx
                .insert(reports)
                .values({
                    siteId: foreman.siteId,
                    createdBy: foreman.id,
                    status: "submitted",
                    notes: reportData.notes,
                    createdAt: reportDate,
                })
                .onConflictDoNothing()
                .returning({
                    id: reports.id,
                });

            if (!report) {
                console.log(
                    `Report ${i + 1} already exists. Skipping.`,
                );

                skippedCount++;
                continue;
            }

            await tx.insert(materials).values(
                reportData.materials.map((material) => ({
                    reportId: report.id,
                    ...material,
                })),
            );

            await tx.insert(machineries).values(
                reportData.machineries.map((machinery) => ({
                    reportId: report.id,
                    ...machinery,
                })),
            );

            insertedCount++;

            console.log(
                `Report ${i + 1} created successfully for ${reportDate.toISOString().slice(0, 10)}.`,
            );
        }

        console.log("\nReport seeding summary:");
        console.log(`Created: ${insertedCount}`);
        console.log(`Skipped: ${skippedCount}`);
    });
}
