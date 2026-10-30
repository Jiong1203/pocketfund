import { vi } from "vitest";
import { createApp } from "../src/app";
import { unauthorized } from "../src/common/errors";
import type { Services } from "../src/container";

export const USER = { id: "user-1", email: "test@example.com" };
export const VALID_TOKEN = "valid-token";
export const FUND_ID = "550e8400-e29b-41d4-a716-446655440000";
export const ACCOUNT_ID = "550e8400-e29b-41d4-a716-446655440001";
export const OTHER_FUND_ID = "550e8400-e29b-41d4-a716-446655440002";

type DeepMock<T> = { [K in keyof T]: { [M in keyof T[K]]: ReturnType<typeof vi.fn> } };

// Route-level harness: real Hono app (routing, auth middleware, validation, error mapping) with mocked services.
export function createTestApp() {
  const services = {
    auth: {
      register: vi.fn(),
      login: vi.fn(),
      verifyAccessToken: vi.fn(async (token: string) => {
        if (token !== VALID_TOKEN) throw unauthorized("Invalid or expired token.");
        return USER;
      })
    },
    accounts: { create: vi.fn(), list: vi.fn(), getById: vi.fn(), update: vi.fn(), delete: vi.fn(), getTransactions: vi.fn() },
    funds: {
      create: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      topUp: vi.fn(),
      expense: vi.fn(),
      transfer: vi.fn(),
      getBalance: vi.fn(),
      getTransactions: vi.fn(),
      getMonthlyFlow: vi.fn()
    },
    transactions: {
      createLedgerTransaction: vi.fn(),
      createFundTransfer: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn()
    },
    schedules: { create: vi.fn(), list: vi.fn(), update: vi.fn(), delete: vi.fn(), executeScheduledTopUps: vi.fn() }
  } satisfies Partial<DeepMock<Services>>;

  const app = createApp({
    openServiceScope: () => ({ services: services as unknown as Services, close: async () => {} })
  });

  const executionCtx = { waitUntil: () => {}, passThroughOnException: () => {}, props: {} } as unknown as ExecutionContext;

  async function call(method: string, path: string, options: { body?: unknown; rawBody?: string; token?: string | null } = {}) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    const token = options.token === undefined ? VALID_TOKEN : options.token;
    if (token) headers.authorization = `Bearer ${token}`;
    const body = options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body));
    const res = await app.request(path, { method, headers, body }, {} as Env, executionCtx);
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
  }

  return { services, call };
}
