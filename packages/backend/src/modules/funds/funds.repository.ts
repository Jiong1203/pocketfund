import type { DatabaseService } from "../../common/database";
import { AppError, notFound } from "../../common/errors";
import type { CreateFundDto, MonthlyFlowQueryDto, UpdateFundDto } from "./funds.schemas";

interface BalanceRow {
  balance: string;
}

export interface FundRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  monthly_amount: string | null;
  cycle_type: string;
  cycle_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MonthlyFlowRow {
  month: string;
  top_up: string;
  expense: string;
}

const FUND_COLUMNS =
  "id, user_id, name, description, monthly_amount, cycle_type, cycle_day, is_active, created_at, updated_at";

export class FundsRepository {
  public constructor(private readonly db: DatabaseService) {}

  public async create(userId: string, dto: CreateFundDto): Promise<FundRow> {
    const result = await this.db.query<FundRow>(
      `
      insert into funds (user_id, name, description, monthly_amount, cycle_day, is_active)
      values ($1, $2, $3, $4, $5, $6)
      returning ${FUND_COLUMNS}
      `,
      [
        userId,
        dto.name,
        dto.description ?? null,
        dto.monthlyAmount ?? null,
        dto.cycleDay ?? 1,
        dto.isActive ?? true
      ]
    );
    return result.rows[0];
  }

  // Balance is computed from the ledger on every read (never persisted).
  public async list(userId: string): Promise<Array<FundRow & { balance: number }>> {
    const result = await this.db.query<FundRow & BalanceRow>(
      `
      select f.*,
        coalesce(
          (select sum(t.amount) from transactions t where t.user_id = f.user_id and t.fund_id = f.id),
          0
        )::numeric(14,2) as balance
      from funds f
      where f.user_id = $1
      order by f.created_at desc
      `,
      [userId]
    );
    return result.rows.map((row) => ({ ...row, balance: Number(row.balance) }));
  }

  public async getById(userId: string, fundId: string): Promise<FundRow> {
    const result = await this.db.query<FundRow>(
      `
      select ${FUND_COLUMNS}
      from funds
      where id = $1 and user_id = $2
      limit 1
      `,
      [fundId, userId]
    );
    const fund = result.rows[0];
    if (!fund) {
      throw notFound("Fund not found.");
    }
    return fund;
  }

  public async update(userId: string, fundId: string, dto: UpdateFundDto): Promise<FundRow> {
    const current = await this.getById(userId, fundId);
    const result = await this.db.query<FundRow>(
      `
      update funds
      set name = $3,
          description = $4,
          monthly_amount = $5,
          cycle_day = $6,
          is_active = $7,
          updated_at = now()
      where id = $1 and user_id = $2
      returning ${FUND_COLUMNS}
      `,
      [
        fundId,
        userId,
        dto.name ?? current.name,
        dto.description ?? current.description,
        dto.monthlyAmount ?? current.monthly_amount,
        dto.cycleDay ?? current.cycle_day,
        dto.isActive ?? current.is_active
      ]
    );
    return result.rows[0];
  }

  public async delete(userId: string, fundId: string): Promise<void> {
    await this.getById(userId, fundId);

    const transactionUsage = await this.db.query<{ count: string }>(
      "select count(*)::text as count from transactions where user_id = $1 and fund_id = $2",
      [userId, fundId]
    );
    const scheduleUsage = await this.db.query<{ count: string }>(
      "select count(*)::text as count from scheduled_topups where user_id = $1 and fund_id = $2",
      [userId, fundId]
    );

    if (Number(transactionUsage.rows[0]?.count ?? 0) > 0 || Number(scheduleUsage.rows[0]?.count ?? 0) > 0) {
      throw new AppError(
        {
          code: "LEDGER_FUND_IN_USE",
          message: "Fund cannot be deleted because it is referenced by ledger data."
        },
        409
      );
    }

    await this.db.query("delete from funds where id = $1 and user_id = $2", [fundId, userId]);
  }

  public async ensureFundExists(userId: string, fundId: string): Promise<void> {
    const result = await this.db.query<{ id: string }>("select id from funds where id = $1 and user_id = $2", [
      fundId,
      userId
    ]);
    if (result.rowCount === 0) {
      throw notFound("Fund not found.");
    }
  }

  public async getFundBalance(userId: string, fundId: string): Promise<number> {
    const result = await this.db.query<BalanceRow>(
      "select coalesce(sum(amount), 0)::numeric(14,2) as balance from transactions where user_id = $1 and fund_id = $2",
      [userId, fundId]
    );
    return Number(result.rows[0].balance);
  }

  public async getFundMonthlyFlow(
    userId: string,
    fundId: string,
    query: MonthlyFlowQueryDto
  ): Promise<Array<{ month: string; topUp: number; expense: number }>> {
    const filters: string[] = ["user_id = $1", "fund_id = $2"];
    const values: unknown[] = [userId, fundId];

    if (query.startAt) {
      values.push(query.startAt);
      filters.push(`occurred_at >= $${values.length}::timestamptz`);
    }
    if (query.endAt) {
      values.push(query.endAt);
      filters.push(`occurred_at <= $${values.length}::timestamptz`);
    }

    const whereClause = filters.join(" and ");
    const result = await this.db.query<MonthlyFlowRow>(
      `
      select
        to_char(date_trunc('month', occurred_at at time zone 'Asia/Taipei'), 'YYYY-MM') as month,
        coalesce(sum(case when type = 'TOP_UP' then amount else 0 end), 0)::numeric(14,2) as top_up,
        coalesce(sum(case when type = 'EXPENSE' then abs(amount) else 0 end), 0)::numeric(14,2) as expense
      from transactions
      where ${whereClause}
      group by 1
      order by 1 asc
      `,
      values
    );

    return result.rows.map((row) => ({
      month: row.month,
      topUp: Number(row.top_up),
      expense: Number(row.expense)
    }));
  }
}
