import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DIRECT_URL;
if (!url) {
  console.error("Missing DIRECT_URL in .env");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
const dir = join(process.cwd(), "sql");

async function main() {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`Applying ${file}...`);
    await sql.unsafe(readFileSync(join(dir, file), "utf8"));
  }
  console.log("SQL files applied.");
}

main()
  .catch((err) => {
    console.error("Failed to apply SQL:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());