
import { and, eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "../db/seed-client";

import {
  profiles,
  reports,
  materials,
  machineries,
  workers,
  siteWorkers,
  reportWorkers,
} from "@/db/schema";

// --------------------------------------------------
// REPORT DATES
// --------------------------------------------------

const REPORT_DATES = [
  new Date("2026-11-24T05:00:00.000Z"),
  new Date("2026-11-25T05:00:00.000Z"),
  new Date("2026-11-26T05:00:00.000Z"),
];

// --------------------------------------------------
// REPORT DATA
// --------------------------------------------------

const REPORT_DATA = [
  {
    notes:
      "Foundation excavation and ground preparation progressed well. Concrete blinding was completed in the designated sections. Materials were delivered and stored safely. Work is progressing according to schedule.",

    workers: [
      { trade: "Mason", number: 4, hours: "8.00" },
      { trade: "General Labourer", number: 6, hours: "8.00" },
      { trade: "Electrician", number: 2, hours: "7.00" },
      { trade: "Plant Operator", number: 1, hours: "7.50" },
      { trade: "Steel Fixer", number: 3, hours: "8.00" },
    ],

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

    workers: [
      { trade: "Mason", number: 3, hours: "8.00" },
      { trade: "General Labourer", number: 8, hours: "8.00" },
      { trade: "Steel Fixer", number: 5, hours: "8.00" },
      { trade: "Carpenter", number: 4, hours: "7.50" },
      { trade: "Plant Operator", number: 2, hours: "6.50" },
    ],

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

    workers: [
      { trade: "Mason", number: 6, hours: "8.00" },
      { trade: "General Labourer", number: 8, hours: "8.00" },
      { trade: "Carpenter", number: 2, hours: "7.00" },
      { trade: "Electrician", number: 1, hours: "6.00" },
      { trade: "Plumber", number: 2, hours: "7.00" },
    ],

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

// --------------------------------------------------
// DEMONSTRATION WORKER ROSTER
// --------------------------------------------------

const WORKER_ROSTER_COUNTS: Record<string, number> = {
  Mason: 6,
  "General Labourer": 8,
  Electrician: 2,
  "Plant Operator": 2,
  "Steel Fixer": 5,
  Carpenter: 4,
  Plumber: 2,
};
const WORKER_NAMES = [
  { firstName: "John", lastName: "Kamau", idNumber: "TEST-W001" },
  { firstName: "Peter", lastName: "Mwangi", idNumber: "TEST-W002" },
  { firstName: "David", lastName: "Ochieng", idNumber: "TEST-W003" },
  { firstName: "Joseph", lastName: "Otieno", idNumber: "TEST-W004" },
  { firstName: "Daniel", lastName: "Kiptoo", idNumber: "TEST-W005" },
  { firstName: "Samuel", lastName: "Mutua", idNumber: "TEST-W006" },
  { firstName: "James", lastName: "Wanjala", idNumber: "TEST-W007" },
  { firstName: "Brian", lastName: "Maina", idNumber: "TEST-W008" },
  { firstName: "Michael", lastName: "Kariuki", idNumber: "TEST-W009" },
  { firstName: "Francis", lastName: "Njoroge", idNumber: "TEST-W010" },
  { firstName: "Patrick", lastName: "Odhiambo", idNumber: "TEST-W011" },
  { firstName: "Kevin", lastName: "Kimani", idNumber: "TEST-W012" },
  { firstName: "George", lastName: "Barasa", idNumber: "TEST-W013" },
  { firstName: "Martin", lastName: "Kibet", idNumber: "TEST-W014" },
  { firstName: "Anthony", lastName: "Musyoka", idNumber: "TEST-W015" },
  { firstName: "Charles", lastName: "Muli", idNumber: "TEST-W016" },
  { firstName: "Robert", lastName: "Githinji", idNumber: "TEST-W017" },
  { firstName: "Eric", lastName: "Onyango", idNumber: "TEST-W018" },
  { firstName: "Dennis", lastName: "Kipchoge", idNumber: "TEST-W019" },
  { firstName: "Stephen", lastName: "Mbugua", idNumber: "TEST-W020" },
  { firstName: "Isaac", lastName: "Wekesa", idNumber: "TEST-W021" },
  { firstName: "Moses", lastName: "Kiprono", idNumber: "TEST-W022" },
  { firstName: "Paul", lastName: "Macharia", idNumber: "TEST-W023" },
  { firstName: "Emmanuel", lastName: "Abdalla", idNumber: "TEST-W024" },
  { firstName: "Peter", lastName: "Kilonzo", idNumber: "TEST-W025" },
  { firstName: "Hassan", lastName: "Mohamed", idNumber: "TEST-W026" },
  { firstName: "Ahmed", lastName: "Hussein", idNumber: "TEST-W027" },
  { firstName: "Ali", lastName: "Abdullahi", idNumber: "TEST-W028" },
  { firstName: "Mohammed", lastName: "Juma", idNumber: "TEST-W029" },
];

function createWorkerRoster() {
  const trades = Object.entries(WORKER_ROSTER_COUNTS);
  let workerIndex = 0;

  return trades.flatMap(([trade, count]) =>
    Array.from({ length: count }, () => {
      const worker = WORKER_NAMES[workerIndex++];

      if (!worker) {
        throw new Error("Not enough worker records in WORKER_NAMES.");
      }

      if (worker.idNumber.startsWith("REPLACE-")) {
        throw new Error(
          `Replace the placeholder ID for ${worker.firstName} ${worker.lastName}.`,
        );
      }

      return {
        // Do not provide id. PostgreSQL generates the UUID.
        firstName: worker.firstName,
        lastName: worker.lastName,
        idNumber: worker.idNumber,
        trade,
        phone: `07000000${String(workerIndex).padStart(2, "0")}`,
        email: `${worker.firstName.toLowerCase()}.${worker.lastName.toLowerCase()}@example.test`,
      };
    }),
  );
}

// --------------------------------------------------
// SEED REPORTS
// --------------------------------------------------

export async function seedReports(): Promise<void> {
  console.log("\n--- SEEDING REPORTS ---\n");

  await db.transaction(async (tx) => {
    // ------------------------------------------------
    // FIND FOREMAN AND SITE
    // ------------------------------------------------

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
      throw new Error("No foreman assigned to a site was found.");
    }

    const siteId = foreman.siteId;

    console.log(`Using foreman: ${foreman.id}`);
    console.log(`Using site: ${siteId}`);

    // ------------------------------------------------
    // REGISTER WORKERS
    // ------------------------------------------------

    const workerRoster = createWorkerRoster();

  await tx
  .insert(workers)
  .values(workerRoster)
  .onConflictDoNothing();

const registeredWorkers = await tx
  .select({
    id: workers.id,
    idNumber: workers.idNumber,
    trade: workers.trade,
  })
  .from(workers)
  .where(
    inArray(
      workers.idNumber,
      workerRoster.map((worker) => worker.idNumber),
    ),
  );

    if (registeredWorkers.length !== workerRoster.length) {
      throw new Error(
        "Could not retrieve all demonstration workers.",
      );
    }

    console.log(`Registered workers: ${registeredWorkers.length}`);

    // ------------------------------------------------
    // ASSIGN WORKERS TO SITE
    // ------------------------------------------------

    await tx
      .insert(siteWorkers)
      .values(
        registeredWorkers.map((worker) => ({
          siteId,
          workerId: worker.id,
        })),
      )
      .onConflictDoNothing();

    console.log("Workers assigned to site successfully.");

    // Group workers by trade
    const workersByTrade = new Map<
      string,
      typeof registeredWorkers
    >();

    for (const worker of registeredWorkers) {
      const existing = workersByTrade.get(worker.trade) ?? [];

      existing.push(worker);

      workersByTrade.set(worker.trade, existing);
    }

    // Keep selection deterministic
    for (const group of workersByTrade.values()) {
      group.sort((a, b) => a.idNumber.localeCompare(b.idNumber));
    }

    // ------------------------------------------------
    // CREATE REPORTS
    // ------------------------------------------------

    let insertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < REPORT_DATA.length; i++) {
      const reportData = REPORT_DATA[i];
      const reportDate = REPORT_DATES[i];

      const [report] = await tx
        .insert(reports)
        .values({
          siteId,
          createdBy: foreman.id,
          notes: reportData.notes,
          createdAt: reportDate,
        })
        .onConflictDoNothing()
        .returning({
          id: reports.id,
        });

      if (!report) {
        console.log(`Report ${i + 1} already exists. Skipping.`);
        skippedCount++;
        continue;
      }

      // ------------------------------------------------
      // INSERT DAILY WORKER ATTENDANCE
      // ------------------------------------------------

      const attendanceRecords = reportData.workers.flatMap(
        (tradeData) => {
          const availableWorkers =
            workersByTrade.get(tradeData.trade) ?? [];

          if (availableWorkers.length < tradeData.number) {
            throw new Error(
              `Not enough ${tradeData.trade} workers registered. ` +
              `Required: ${tradeData.number}, available: ${availableWorkers.length}.`,
            );
          }

          return availableWorkers
            .slice(0, tradeData.number)
            .map((worker) => ({
              reportId: report.id,
              workerId: worker.id,
              hours: tradeData.hours,
            }));
        },
      );

      // Verify site assignments before recording attendance
      const assignedWorkerIds = await tx
        .select({
          workerId: siteWorkers.workerId,
        })
        .from(siteWorkers)
        .where(
          and(
            eq(siteWorkers.siteId, siteId),
            inArray(
              siteWorkers.workerId,
              attendanceRecords.map((record) => record.workerId),
            ),
          ),
        );

      if (assignedWorkerIds.length !== attendanceRecords.length) {
        throw new Error(
          `Some workers in report ${i + 1} are not assigned to this site.`,
        );
      }

      await tx.insert(reportWorkers).values(attendanceRecords);

      // ------------------------------------------------
      // INSERT MATERIALS
      // ------------------------------------------------

      await tx.insert(materials).values(
        reportData.materials.map((material) => ({
          reportId: report.id,
          ...material,
        })),
      );

      // ------------------------------------------------
      // INSERT MACHINERIES
      // ------------------------------------------------

      await tx.insert(machineries).values(
        reportData.machineries.map((machinery) => ({
          reportId: report.id,
          ...machinery,
        })),
      );

      insertedCount++;

      console.log(
        `Report ${i + 1} created successfully for ${reportDate
          .toISOString()
          .slice(0, 10)}.`,
      );

      console.log(
        `  Workers in attendance: ${attendanceRecords.length}`,
      );

      console.log(`  Materials: ${reportData.materials.length}`);
      console.log(`  Machineries: ${reportData.machineries.length}`);
    }

    // ------------------------------------------------
    // SUMMARY
    // ------------------------------------------------

    console.log("\nReport seeding summary:");
    console.log(`Created: ${insertedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Registered workers: ${registeredWorkers.length}`);
    console.log(`Site assignments: ${registeredWorkers.length}`);
  });

  console.log("\n--- REPORT SEEDING COMPLETED ---\n");
}
