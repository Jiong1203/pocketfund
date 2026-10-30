import { beforeEach, describe, expect, it } from "vitest";
import { ACCOUNT_ID, FUND_ID, OTHER_FUND_ID, USER, createTestApp } from "./helpers";

describe("Ledger routes", () => {
  let harness: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    harness = createTestApp();
  });

  it("POST /funds/:id/top-ups calls topUp with the authenticated user", async () => {
    harness.services.funds.topUp.mockResolvedValue({ id: "tx1" });

    const res = await harness.call("POST", `/funds/${FUND_ID}/top-ups`, { body: { accountId: ACCOUNT_ID, amount: 1200 } });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe("tx1");
    expect(harness.services.funds.topUp).toHaveBeenCalledWith(USER.id, FUND_ID, { accountId: ACCOUNT_ID, amount: 1200 });
  });

  it("POST /funds/:id/expenses calls expense with the authenticated user", async () => {
    harness.services.funds.expense.mockResolvedValue({ id: "tx2" });

    const res = await harness.call("POST", `/funds/${FUND_ID}/expenses`, { body: { accountId: ACCOUNT_ID, amount: 500 } });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe("tx2");
    expect(harness.services.funds.expense).toHaveBeenCalledWith(USER.id, FUND_ID, { accountId: ACCOUNT_ID, amount: 500 });
  });

  it("POST /funds/:id/transfers calls transfer with the source fund from the path", async () => {
    harness.services.funds.transfer.mockResolvedValue({ from: { id: "out" }, to: { id: "in" } });
    const body = { toFundId: OTHER_FUND_ID, accountId: ACCOUNT_ID, amount: 800 };

    const res = await harness.call("POST", `/funds/${FUND_ID}/transfers`, { body });

    expect(res.status).toBe(201);
    expect(res.body.data.to.id).toBe("in");
    expect(harness.services.funds.transfer).toHaveBeenCalledWith(USER.id, FUND_ID, body);
  });

  it("POST /funds/:id/transfers rejects a missing destination fund", async () => {
    const res = await harness.call("POST", `/funds/${FUND_ID}/transfers`, { body: { accountId: ACCOUNT_ID, amount: 800 } });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(harness.services.funds.transfer).not.toHaveBeenCalled();
  });

  it("GET /funds/:id/balance returns the computed balance", async () => {
    harness.services.funds.getBalance.mockResolvedValue({ fundId: FUND_ID, balance: 850 });

    const res = await harness.call("GET", `/funds/${FUND_ID}/balance`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { fundId: FUND_ID, balance: 850 } });
  });

  it("GET /funds/:id/transactions coerces query params", async () => {
    harness.services.funds.getTransactions.mockResolvedValue({ items: [], meta: { page: 2, pageSize: 10, total: 0 } });

    const res = await harness.call("GET", `/funds/${FUND_ID}/transactions?page=2&pageSize=10&type=EXPENSE`);

    expect(res.status).toBe(200);
    expect(harness.services.funds.getTransactions).toHaveBeenCalledWith(USER.id, FUND_ID, {
      page: 2,
      pageSize: 10,
      type: "EXPENSE"
    });
  });

  it("POST /schedules/top-ups creates a schedule", async () => {
    const payload = { fundId: FUND_ID, accountId: ACCOUNT_ID, amount: 1200, cycleDay: 1 };
    harness.services.schedules.create.mockResolvedValue({ id: "sch1" });

    const res = await harness.call("POST", "/schedules/top-ups", { body: payload });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe("sch1");
    expect(harness.services.schedules.create).toHaveBeenCalledWith(USER.id, payload);
  });

  it("GET /schedules/top-ups lists schedules", async () => {
    harness.services.schedules.list.mockResolvedValue([{ id: "sch1" }]);

    const res = await harness.call("GET", "/schedules/top-ups");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(harness.services.schedules.list).toHaveBeenCalledWith(USER.id);
  });

  it("DELETE /transactions/:id returns 204 with no body", async () => {
    harness.services.transactions.deleteTransaction.mockResolvedValue(undefined);

    const res = await harness.call("DELETE", `/transactions/${FUND_ID}`);

    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });

  describe("validation", () => {
    it.each([
      ["zero amount", { accountId: ACCOUNT_ID, amount: 0 }],
      ["more than 2 decimals", { accountId: ACCOUNT_ID, amount: 1.005 }],
      ["non-uuid account", { accountId: "abc", amount: 10 }],
      ["unknown field", { accountId: ACCOUNT_ID, amount: 10, extra: true }],
      ["bad date", { accountId: ACCOUNT_ID, amount: 10, occurredAt: "yesterday" }]
    ])("rejects %s with VALIDATION_ERROR", async (_label, body) => {
      const res = await harness.call("POST", `/funds/${FUND_ID}/top-ups`, { body });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(harness.services.funds.topUp).not.toHaveBeenCalled();
    });

    it("rejects a non-uuid path id", async () => {
      const res = await harness.call("GET", "/funds/not-a-uuid/balance");
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects malformed JSON", async () => {
      const res = await harness.call("POST", `/funds/${FUND_ID}/top-ups`, { rawBody: "{nope" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("auth and errors", () => {
    it("requires a bearer token", async () => {
      const res = await harness.call("GET", "/funds", { token: null });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_UNAUTHORIZED");
    });

    it("rejects an invalid token with 401", async () => {
      const res = await harness.call("GET", "/funds", { token: "forged" });
      expect(res.status).toBe(401);
    });

    it("hides unexpected errors behind SYSTEM_INTERNAL_ERROR", async () => {
      harness.services.funds.list.mockRejectedValue(new Error("db exploded"));

      const res = await harness.call("GET", "/funds");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: { code: "SYSTEM_INTERNAL_ERROR", message: "Internal server error." } });
    });

    it("returns a request id header", async () => {
      const res = await harness.call("GET", "/health", { token: null });
      expect(res.status).toBe(200);
      expect(res.headers.get("x-request-id")).toBeTruthy();
    });

    it("returns a JSON 404 for unknown API routes", async () => {
      const res = await harness.call("GET", "/funds/x/y/z");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });
});
