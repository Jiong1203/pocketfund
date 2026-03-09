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

   - `npm run start:dev`

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
- Scheduled Top-ups
  - `POST /schedules/top-ups`
  - `GET /schedules/top-ups`
  - `PATCH /schedules/top-ups/:id`
  - `DELETE /schedules/top-ups/:id`

All non-auth endpoints require `Authorization: Bearer <accessToken>`.

## Observability

- Every request has `x-request-id` (generated if not provided).
- HTTP access logs are emitted as structured JSON lines.
- Recommended to pass your own `x-request-id` from frontend or API gateway.

## Error Response Format

All API errors follow:

`{ "error": { "code": "ERROR_CODE", "message": "Human readable message", "details": {} } }`
