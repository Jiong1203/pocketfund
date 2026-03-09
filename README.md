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

6. Run e2e tests:

   - `npm run test:e2e`

7. (Optional) Run DB integration tests:

   - set `INTEGRATION_TEST_DATABASE_URL`
   - `npm run test:integration`

## Deployment

### Fly.io (推薦 - 0 成本)

快速部署到 Fly.io（免費額度永久有效）：

```bash
# 安裝 Fly CLI
iwr https://fly.io/install.ps1 -useb | iex  # Windows
# curl -L https://fly.io/install.sh | sh     # macOS/Linux

# 登入
fly auth login

# 部署 Backend
fly launch --no-deploy
fly secrets set DATABASE_URL="your-supabase-url"
fly secrets set JWT_SECRET="your-secret"
fly deploy

# 部署 Frontend (記得先修改 frontend/nginx.conf 中的 Backend URL)
cd frontend
fly launch --no-deploy
fly deploy
```

📚 **詳細部署文件**:
- [QUICKSTART_FLYIO.md](./QUICKSTART_FLYIO.md) - 3 步驟快速入門
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南

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
- Theme:
  - supports `淺色 / 深色` toggle
  - preference persists in `localStorage`
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
