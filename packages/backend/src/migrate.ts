import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

async function migrate(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const migrationsDir = path.resolve(__dirname, "../migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rowCount } = await client.query(
        "select 1 from schema_migrations where filename = $1",
        [file]
      );

      if ((rowCount ?? 0) > 0) {
        console.log(`[skip] ${file}`);
        continue;
      }

      console.log(`[run]  ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into schema_migrations (filename) values ($1)",
          [file]
        );
        await client.query("commit");
        console.log(`[done] ${file}`);
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }

    console.log("Migrations complete.");
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
