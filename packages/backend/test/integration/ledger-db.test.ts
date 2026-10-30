import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DatabaseService } from "../../src/common/database";
import { FundsRepository } from "../../src/modules/funds/funds.repository";

// Runs only when INTEGRATION_TEST_DATABASE_URL points at a migrated Postgres database.
const databaseUrl = process.env.INTEGRATION_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("Ledger DB integration", () => {
  let client: pg.Client;

  beforeAll(async () => {
    client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
  });

  it("computes fund balance from the transaction ledger", async () => {
    await client.query("begin");
    try {
      const userId = (
        await client.query<{ id: string }>(
          "insert into users (email, password_hash) values ($1, 'hash') returning id",
          [`integration_${Date.now()}@example.com`]
        )
      ).rows[0].id;
      const fundId = (
        await client.query<{ id: string }>(
          "insert into funds (user_id, name, cycle_day, is_active) values ($1, 'Pet Fund', 1, true) returning id",
          [userId]
        )
      ).rows[0].id;
      const accountId = (
        await client.query<{ id: string }>(
          "insert into accounts (user_id, name, type) values ($1, 'Salary Account', 'salary') returning id",
          [userId]
        )
      ).rows[0].id;

      await client.query(
        `
        insert into transactions (user_id, fund_id, account_id, type, amount, description, occurred_at, idempotency_key)
        values
          ($1, $2, $3, 'TOP_UP', 1200, 'top up', now(), $4),
          ($1, $2, $3, 'EXPENSE', -350, 'expense', now(), $5)
        `,
        [userId, fundId, accountId, `it-top-up-${Date.now()}`, `it-expense-${Date.now()}`]
      );

      // Run the real repository query against the same (uncommitted) transaction.
      const db = { query: client.query.bind(client) } as unknown as DatabaseService;
      await expect(new FundsRepository(db).getFundBalance(userId, fundId)).resolves.toBe(850);
    } finally {
      await client.query("rollback");
    }
  });
});
