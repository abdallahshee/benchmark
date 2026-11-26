
import { runUserSeed } from "./seed-users";
import { seedReports } from "./seed-reports";
import { closeSeedDb } from "../db/seed-client";

async function main() {
    try {
        console.log("================================");
        console.log("   DATABASE SEEDING STARTED");
        console.log("================================");

        // Step 1: Create site and users.
        await runUserSeed();

        console.log("\nUsers seeded successfully.");

        // Step 2: Create reports, materials and machinery.
        await seedReports();

        console.log("\n================================");
        console.log("   DATABASE SEEDING COMPLETED");
        console.log("================================");
    } finally {
        // Always close the standalone database connection.
        await closeSeedDb();
    }
}

main().catch((error) => {
    console.error("\nDatabase seeding failed:", error);
    process.exitCode = 1;
});
