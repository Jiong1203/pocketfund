# pocketfund

`pocketfund` is a Phase 2.5 async-first virtual fund bookkeeping app, aligned with `CLAUDE.md`.
It runs as a single Cloudflare Worker that serves both the Vue SPA and the API.

## Current Scope

- Ledger-first transaction model
- Balance by query (no persisted fund balance field)
- Async-first scheduling path for recurring top-ups (Workers Cron Trigger)

## Architecture

| Part | Path | Stack |
| --- | --- | --- |
| API Worker | `packages/backend` | Hono + zod + `pg`, on Cloudflare Workers |
| Frontend | `packages/frontend` | Vue 3 + TypeScript + Vue Router + Vite |
| Worker config | `packages/frontend/cloudflare.config.ts` | `cf` CLI + Cloudflare Vite plugin |
| Database | — | Supabase PostgreSQL, reached through Cloudflare Hyperdrive |

- Requests to `/health`, `/auth`, `/accounts`, `/funds`, `/transactions`, `/schedules` run the Worker (`packages/backend/src/index.ts`); everything else is served from the built SPA assets with SPA fallback.
- The daily scheduled top-up runs at 00:05 UTC via a Cron Trigger (`src/jobs/scheduled-topups.job.ts` → `SchedulesService.executeScheduledTopUps`).
- Passwords are hashed with PBKDF2 (WebCrypto). Legacy bcrypt hashes are still accepted and upgraded on the next successful login.

## Quick Start (local)

Requires Node.js 22.18+.

1. Install dependencies: `npm install`
2. Configure local settings:
   - `packages/backend/.env.example` → `packages/backend/.env`, set `DATABASE_URL` (used by migrations)
   - `packages/frontend/.env.example` → `packages/frontend/.env`, set `LOCAL_DATABASE_URL` (used by `npm run dev`)
   - `packages/frontend/.dev.vars.example` → `packages/frontend/.dev.vars`, set `JWT_SECRET`
3. Apply migrations: `npm run migrate`
4. Start the dev server (SPA + API in the Workers runtime): `npm run dev`, then open `http://localhost:5173`
5. Run tests: `npm test`
   - DB integration test: set `INTEGRATION_TEST_DATABASE_URL`, then `npm run test:integration --workspace packages/backend`
6. Typecheck the Worker: `npm run typecheck`

## Deployment (Cloudflare Workers)

Production: https://pocketfund.joe-lab.workers.dev (Worker `pocketfund`, Hyperdrive `pocketfund-db` with query caching disabled).

One-time setup (`cf auth login` first) — already done for the current deployment:

1. Create a Hyperdrive config pointing at Supabase (use the direct/session connection string), then put its ID into `HYPERDRIVE_ID` in `packages/frontend/cloudflare.config.ts`.
   - Find the command with `cf cli search "create hyperdrive config"`.
2. Deploy once: `npm run deploy`
3. Set the JWT secret on the Worker: `npx wrangler secret put JWT_SECRET --name pocketfund`
   - Reuse the old `JWT_SECRET` value to keep existing login tokens valid.

After that, `npm run deploy` builds and deploys the SPA and API together.

## Implemented APIs (Phase 2.5 - Stage 2)

- Health
  - `GET /health`
- Auth
  - `POST /auth/register`
  - `POST /auth/login`
- Accounts CRUD
  - `POST /accounts`
  - `GET /accounts`
  - `GET /accounts/:id`
  - `PATCH /accounts/:id`
  - `DELETE /accounts/:id`
  - `GET /accounts/:id/transactions?page=1&pageSize=20&type=EXPENSE&startAt=2026-01-01T00:00:00.000Z&endAt=2026-12-31T23:59:59.999Z`
- Funds CRUD + Ledger Operations
  - `POST /funds`
  - `GET /funds`
  - `GET /funds/:id`
  - `PATCH /funds/:id`
  - `DELETE /funds/:id`
  - `POST /funds/:id/top-ups`
  - `POST /funds/:id/expenses`
  - `GET /funds/:id/balance`
  - `GET /funds/:id/transactions?page=1&pageSize=20&type=TOP_UP&startAt=2026-01-01T00:00:00.000Z&endAt=2026-12-31T23:59:59.999Z`
  - `GET /funds/:id/monthly-flow?startAt=2026-01-01T00:00:00.000Z&endAt=2026-12-31T23:59:59.999Z`
- Transactions
  - `PATCH /transactions/:id`
  - `DELETE /transactions/:id`
- Scheduled Top-ups
  - `POST /schedules/top-ups`
  - `GET /schedules/top-ups`
  - `PATCH /schedules/top-ups/:id`
  - `DELETE /schedules/top-ups/:id`

All endpoints except `/health` and `/auth/*` require `Authorization: Bearer <accessToken>`.

## Frontend (zh-tw)

- Path: `packages/frontend/`
- Pages:
  - `登入 / 註冊` 頁
  - `儀表板`（帳戶、基金、交易新增、交易查詢）
  - `基金圖表中心`（每月儲值/支出聚合圖）
- Theme: `淺色 / 深色` toggle, persisted in `localStorage`
  - Light theme brand color: SHINee Pearl Aqua (`#7af5e0`); dark theme brand color: BABYMONSTER red (`#e60000`)
  - Design tokens and shared button / form / dialog styles live in `src/style.css`
- Responsive: phones get icon navigation, card-style transaction rows, and bottom-sheet dialogs
- Code layout:
  - API types in `src/types/api.ts`
  - API service layer in `src/services/pocketfund.ts`
  - reusable components in `src/components/*`
  - lightweight SVG chart component `FundFlowChart.vue` (no charting library)

## Observability

- Every request has `x-request-id` (generated if not provided).
- HTTP access logs, cron job runs, and unhandled errors are emitted as structured JSON lines.
- Workers Logs and Traces are enabled in `cloudflare.config.ts`.

## Error Response Format

All API errors follow:

`{ "error": { "code": "ERROR_CODE", "message": "Human readable message", "details": {} } }`
