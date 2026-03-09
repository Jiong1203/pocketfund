# pocketfund

`pocketfund` is a Phase 2.5 async-first backend for virtual fund bookkeeping, aligned with `CLAUDE.md`.

## Current Scope

- Ledger-first transaction model
- Balance by query (no persisted fund balance field)
- Async-first scheduling path for recurring top-ups

## Quick Start

1. Copy environment values:

   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL`
   - Set `JWT_SECRET`

2. Install dependencies:

   - `npm install`

3. Apply migration:

   - Run `migrations/001_init_ledger.sql` on PostgreSQL
   - Run `migrations/002_auth_and_ownership.sql` on PostgreSQL

4. Start dev server:

   - `npm run dev`
   - open `http://localhost:3000` to use the built-in demo UI

5. Start Vue frontend (zh-tw):

   - `npm run dev:frontend`
   - open `http://localhost:5173`

5. Run e2e tests:

   - `npm run test:e2e`

6. (Optional) Run DB integration tests:

   - set `INTEGRATION_TEST_DATABASE_URL`
   - `npm run test:integration`

## Implemented APIs (Phase 2.5 - Stage 2)

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
  - `POST /funds/:id/adjustments`
  - `GET /funds/:id/balance`
  - `GET /funds/:id/transactions?page=1&pageSize=20&type=TOP_UP&startAt=2026-01-01T00:00:00.000Z&endAt=2026-12-31T23:59:59.999Z`
  - `GET /funds/:id/monthly-flow?startAt=2026-01-01T00:00:00.000Z&endAt=2026-12-31T23:59:59.999Z`
- Scheduled Top-ups
  - `POST /schedules/top-ups`
  - `GET /schedules/top-ups`
  - `PATCH /schedules/top-ups/:id`
  - `DELETE /schedules/top-ups/:id`

All non-auth endpoints require `Authorization: Bearer <accessToken>`.

## Built-in Demo UI

- Served as static files from `public/`
- Includes: register/login, create account, create fund, top-up/expense, and transaction query
- Purpose: quickly inspect backend behavior before full frontend implementation

## Vue Frontend Skeleton (zh-tw)

- Path: `frontend/`
- Stack: Vue 3 + TypeScript + Vue Router + Vite
- Current pages:
  - `登入 / 註冊` 頁
  - `儀表板`（帳戶、基金、交易新增、交易查詢）
  - `基金圖表中心`（每月儲值/支出聚合圖）
- API proxy: Vite forwards `/auth`, `/accounts`, `/funds`, `/schedules` to backend `http://localhost:3000`
- UI upgrades:
  - centralized API types in `frontend/src/types/api.ts`
  - API service layer in `frontend/src/services/pocketfund.ts`
  - reusable components in `frontend/src/components/*`
  - ECharts chart component `FundFlowChart.vue` (loaded on chart page)

## Observability

- Every request has `x-request-id` (generated if not provided).
- HTTP access logs are emitted as structured JSON lines.
- Recommended to pass your own `x-request-id` from frontend or API gateway.

## Error Response Format

All API errors follow:

`{ "error": { "code": "ERROR_CODE", "message": "Human readable message", "details": {} } }`
