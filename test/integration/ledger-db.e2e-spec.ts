import { Pool } from "pg";

const databaseUrl = process.env.INTEGRATION_TEST_DATABASE_URL;
const describeIfDb = databaseUrl ? describe : describe.skip;

describeIfDb("Ledger DB integration", () => {
  let pool: Pool;
  const userEmail = `integration_${Date.now()}@example.com`;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: databaseUrl
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("computes fund balance from transaction ledger", async () => {
    const client = await pool.connect();
    try {
      await client.query("begin");

      const userRes = await client.query<{ id: string }>(
        `
        insert into users (email, password_hash)
        values ($1, 'hash')
        returning id
        `,
        [userEmail]
      );
      const userId = userRes.rows[0].id;

      const fundRes = await client.query<{ id: string }>(
        `
        insert into funds (user_id, name, cycle_day, is_active)
        values ($1, 'Pet Fund', 1, true)
        returning id
        `,
        [userId]
      );
      const fundId = fundRes.rows[0].id;

      const accountRes = await client.query<{ id: string }>(
        `
        insert into accounts (user_id, name, type)
        values ($1, 'Salary Account', 'salary')
        returning id
        `,
        [userId]
      );
      const accountId = accountRes.rows[0].id;

      await client.query(
        `
        insert into transactions (user_id, fund_id, account_id, type, amount, description, occurred_at, idempotency_key)
        values
          ($1, $2, $3, 'TOP_UP', 1200, 'top up', now(), 'it-top-up'),
          ($1, $2, $3, 'EXPENSE', -350, 'expense', now(), 'it-expense')
        `,
        [userId, fundId, accountId]
      );

      const balanceRes = await client.query<{ balance: string }>(
        `
        select coalesce(sum(amount), 0)::numeric(14,2) as balance
        from transactions
        where user_id = $1 and fund_id = $2
        `,
        [userId, fundId]
      );

      expect(Number(balanceRes.rows[0].balance)).toBe(850);
      await client.query("rollback");
    } finally {
      client.release();
    }
  });
});
