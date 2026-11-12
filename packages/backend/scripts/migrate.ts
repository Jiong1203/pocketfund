// Applies SQL files in ../migrations to DATABASE_URL in filename order (Node.js script, not part of the Worker).
// Usage: npm run migrate         (reads DATABASE_URL from packages/backend/.env)
//        npm run migrate:status  (--check: only lists pending files, applies nothing)
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const checkOnly = process.argv.includes("--check");

async function migrate(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const migrationsDir = path.resolve(import.meta.dirname, "../migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (checkOnly) {
      const applied = await client.query<{ filename: string }>("select filename from schema_migrations");
      const appliedSet = new Set(applied.rows.map((row) => row.filename));
      const pending = files.filter((file) => !appliedSet.has(file));
      for (const file of pending) {
        console.log(`[pending] ${file}`);
      }
      console.log(pending.length > 0 ? `Pending migrations: ${pending.length}` : "No pending migrations.");
      return;
    }

    for (const file of files) {
      const { rowCount } = await client.query("select 1 from schema_migrations where filename = $1", [file]);

      if ((rowCount ?? 0) > 0) {
        console.log(`[skip] ${file}`);
        continue;
      }

      console.log(`[run]  ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations (filename) values ($1)", [file]);
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
