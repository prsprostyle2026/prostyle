// Creates the tables in db/schema.sql. Usage: npm run db:setup
import { readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
  const { rows } = await client.query("select current_database() as db, version() as v");
  console.log(`Schema applied to "${rows[0].db}" (${rows[0].v.split(",")[0]}).`);
} catch (err) {
  console.error("Database setup failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
