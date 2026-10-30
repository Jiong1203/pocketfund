import { existsSync } from "node:fs";
import { join } from "node:path";
import { bindings, defineConfig, triggers } from "cf/config";
import * as entrypoint from "../backend/src/index.ts" with { type: "cf-worker" };

// Local-only settings (LOCAL_DATABASE_URL) live in packages/frontend/.env, which is git-ignored.
const localEnvFile = join(import.meta.dirname, ".env");
if (existsSync(localEnvFile)) process.loadEnvFile(localEnvFile);

// One Worker serves both the Vue SPA (static assets) and the API (packages/backend).
// Hyperdrive config "pocketfund-db" (points at Supabase, query caching disabled so balances are never stale).
// The ID is not a secret.
const HYPERDRIVE_ID = "3cae814ba77b4f5b84d3c5b15e6e566d";

const API_PATHS = ["/health", "/auth", "/accounts", "/funds", "/transactions", "/schedules"];

export default defineConfig({
  worker: {
    name: "pocketfund",
    entrypoint,
    compatibilityDate: "2026-10-29",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      notFoundHandling: "single-page-application",
      runWorkerFirst: API_PATHS.flatMap((path) => [path, `${path}/*`])
    },
    env: {
      HYPERDRIVE: bindings.hyperdrive({
        id: HYPERDRIVE_ID,
        // Local dev connects straight to Postgres; set LOCAL_DATABASE_URL in packages/frontend/.env
        dev: { connectionString: process.env.LOCAL_DATABASE_URL }
      }),
      JWT_SECRET: bindings.secret()
    },
    // 00:05 UTC daily, same schedule the NestJS cron used on the (UTC) Fly.io machines.
    triggers: [triggers.scheduled({ schedule: "5 0 * * *" })],
    observability: {
      enabled: true,
      logs: { enabled: true },
      traces: { enabled: true }
    }
  }
});
