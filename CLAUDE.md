# CLAUDE.md

This document defines the development standards for `virtual-fund-ledger`.
Goals:

1. Adopt a **Phase 2.5 strategy** for the best balance of delivery speed and long-term scalability.
2. Ship quickly with **Phase 2 (light public release)** foundations.
3. Stay upgrade-ready for **Phase 3 (SaaS scale)** without major rewrites.

Policy:

- This document (`CLAUDE.md`) is the authoritative development standard for this project.
- Standards in this file are expected to evolve and can be updated as requirements change.

---

## 1) Core Principles

- **Ledger First**: `transaction` is the single source of truth.
- **Balance by Query**: fund balance is always computed from transactions; do not persist `fund_balance`.
- **Decouple Account and Fund**: `account` means where money is stored; `fund` means what money is for.
- **Append-Only Preferred**: write new records instead of overwriting historical transactions.
- **Traceability**: every transaction must be traceable by source, time, operator, and description.
- **Async-First Development**: design long-running, retryable, or heavy workloads as asynchronous jobs by default.

---

## 2) Backend Structure and Layers

Use NestJS and enforce a layered design:

- `modules/*`: feature modules (`funds`, `accounts`, `transactions`, `schedules`)
- `controllers`: input/output and validation only, no business rules
- `services`: business rules and ledger behavior
- `repositories`: data access only
- `jobs`: scheduling entry points (Phase 2: cron, Phase 3: queue consumers)

Rules:

- Controllers must not call ORM queries directly.
- Schedulers must not contain business rules; they may only call services.
- Any money movement must go through `TransactionService`.

---

## 3) Naming Conventions

### 3.1 API Paths

- Use plural resource names: `/funds`, `/accounts`, `/transactions`
- Use action endpoints for domain operations:
  - `POST /funds/:id/top-ups`
  - `POST /funds/:id/expenses`
  - `POST /funds/:id/adjustments`

### 3.2 Code Naming

- Classes: `PascalCase`
- Variables/functions: `camelCase`
- Constants/enum values: `UPPER_SNAKE_CASE`
- Tables/columns: `snake_case`

### 3.3 Transaction Type Enum

- `TOP_UP`
- `EXPENSE`
- `ADJUST`
- `TRANSFER`

---

## 4) Database Standards (PostgreSQL)

- Primary keys should use `uuid`.
- Every table must include:
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- Money fields must use `numeric(14,2)` (never float/double).
- All time fields must use `timestamptz`.
- Required indexes:
  - `transactions(fund_id, occurred_at)`
  - `transactions(account_id, occurred_at)`
  - `transactions(type, occurred_at)`

Data integrity:

- Keep amount sign rules consistent (for example: `TOP_UP > 0`, `EXPENSE < 0`).
- Enforce illegal values with DB constraints/check constraints.
- Never delete transaction history. Use `ADJUST` for corrections.

---

## 5) Ledger and Domain Rules

- Fund balance formula:
  - `balance = SUM(transactions.amount WHERE fund_id = :fundId)`
- If negative balance is not allowed, reject expense requests in the service layer.
- Prevent duplicate posting for the same request:
  - implement `idempotency_key` (client-provided or generated)
- Every transaction must include:
  - `fund_id`, `account_id`, `type`, `amount`, `occurred_at`
  - `description` (optional but recommended)

---

## 6) Scheduling Rules (Phase 2 -> Phase 3)

The project follows an **async-first** implementation model:

- Background jobs are the default for scheduled tasks, notifications, and heavy reporting workloads.
- Request/response APIs should stay thin and offload non-critical work to job execution paths.

Phase 2 may use `node-cron`, but must follow:

- Cron only triggers jobs; it does not contain business logic.
- Scheduled top-up must call `TopUpService.executeScheduledTopUp(...)`.
- Job runs must be logged with status (success/failure/retry count).

Phase 3 readiness requirements:

- Wrap schedule payloads as serializable data (directly enqueueable to BullMQ).
- Keep service inputs/outputs runtime-agnostic to avoid cron lock-in.

---

## 7) API and Error Handling

- Standard response format:
  - success: `{ data, meta }`
  - error: `{ error: { code, message, details? } }`
- Error code groups:
  - `VALIDATION_*`
  - `AUTH_*`
  - `LEDGER_*`
  - `SYSTEM_*`
- Do not expose raw exception stacks to frontend clients.

---

## 8) Validation and Security

- All inputs must pass DTO/schema validation (type, range, required fields).
- Amount cannot be 0 (unless explicitly allowed by `ADJUST` rules).
- Enforce least privilege: users can only access their own funds/accounts/transactions.
- Record audit logs for critical operations (fund creation, manual adjustments, schedule disablement).

---

## 9) Testing Standards

Minimum test coverage:

- Unit tests:
  - `TOP_UP` posts correctly
  - `EXPENSE` posts correctly
  - balance calculation is correct
  - invalid input is rejected
- Integration tests:
  - `POST /funds/:id/top-ups`
  - `POST /funds/:id/expenses`
  - `GET /funds/:id/balance`
- When adding a new transaction type, add matching unit and integration tests.

---

## 10) Observability and Operations

- Every request should include `request_id`.
- Log transaction and scheduler flows with structured JSON logs.
- Minimum metrics:
  - API latency
  - scheduler success rate
  - transaction write error rate

---

## 11) Versioning and Migration Strategy

- All schema changes must use migrations (no manual production DB edits).
- Every migration must support rollback.
- Breaking changes follow two phases:
  1. Deploy backward-compatible schema/logic first
  2. Remove legacy fields only after data migration is complete

---

## 12) Must-Not Rules

- Do not treat persisted fund balance as the source of truth.
- Do not place business logic in controllers.
- Do not scatter SQL and rules across cron/job files.
- Do not use floating-point numbers for money.
- Do not delete historical transactions to hide ledger history.

---

## 13) Recommended MVP Delivery Order

1. Create `funds/accounts/transactions` schema + migrations.
2. Implement transaction write APIs (`top-up`, `expense`, `adjust`).
3. Implement fund balance and fund detail query APIs.
4. Add monthly top-up scheduling (cron trigger + service execution).
5. Add chart/query APIs (monthly income/expense and balance trend).
6. Add tests and baseline monitoring.

---

This document is a shared development contract for the team.
Any updates should be submitted via PR with rationale and impact notes.
