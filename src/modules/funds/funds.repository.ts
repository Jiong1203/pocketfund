import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { AppException } from "../../common/errors/app-exception";
import { DatabaseService } from "../../common/database/database.service";
import { ListTransactionsQueryDto } from "../transactions/dto/list-transactions-query.dto";
import { TransactionRecord } from "../transactions/transactions.types";
import { CreateFundDto } from "./dto/create-fund.dto";
import { UpdateFundDto } from "./dto/update-fund.dto";

interface BalanceRow {
  balance: string;
}

interface FundRow {
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

interface CountRow {
  total: string;
}

@Injectable()
export class FundsRepository {
  public constructor(private readonly db: DatabaseService) {}

  public async create(userId: string, dto: CreateFundDto): Promise<FundRow> {
    const result = await this.db.query<FundRow>(
      `
      insert into funds (user_id, name, description, monthly_amount, cycle_day, is_active)
      values ($1, $2, $3, $4, $5, $6)
      returning id, user_id, name, description, monthly_amount, cycle_type, cycle_day, is_active, created_at, updated_at
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

  public async list(userId: string): Promise<FundRow[]> {
    const result = await this.db.query<FundRow>(
      `
      select id, user_id, name, description, monthly_amount, cycle_type, cycle_day, is_active, created_at, updated_at
      from funds
      where user_id = $1
      order by created_at desc
      `,
      [userId]
    );
    return result.rows;
  }

  public async getById(userId: string, fundId: string): Promise<FundRow> {
    const result = await this.db.query<FundRow>(
      `
      select id, user_id, name, description, monthly_amount, cycle_type, cycle_day, is_active, created_at, updated_at
      from funds
      where id = $1 and user_id = $2
      limit 1
      `,
      [fundId, userId]
    );
    const fund = result.rows[0];
    if (!fund) {
      throw new NotFoundException("Fund not found.");
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
      returning id, user_id, name, description, monthly_amount, cycle_type, cycle_day, is_active, created_at, updated_at
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
      throw new AppException(
        {
          code: "LEDGER_FUND_IN_USE",
          message: "Fund cannot be deleted because it is referenced by ledger data."
        },
        HttpStatus.CONFLICT
      );
    }

    await this.db.query("delete from funds where id = $1 and user_id = $2", [fundId, userId]);
  }

  public async ensureFundExists(userId: string, fundId: string): Promise<void> {
    const result = await this.db.query<{ id: string }>(
      "select id from funds where id = $1 and user_id = $2",
      [fundId, userId]
    );
    if (result.rowCount === 0) {
      throw new NotFoundException("Fund not found.");
    }
  }

  public async getFundBalance(userId: string, fundId: string): Promise<number> {
    const result = await this.db.query<BalanceRow>(
      "select coalesce(sum(amount), 0)::numeric(14,2) as balance from transactions where user_id = $1 and fund_id = $2",
      [userId, fundId]
    );
    return Number(result.rows[0].balance);
  }

  public async getFundTransactions(
    userId: string,
    fundId: string,
    query: ListTransactionsQueryDto
  ): Promise<{ items: TransactionRecord[]; meta: { page: number; pageSize: number; total: number } }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const filters: string[] = ["user_id = $1", "fund_id = $2"];
    const values: unknown[] = [userId, fundId];

    if (query.type) {
      values.push(query.type);
      filters.push(`type = $${values.length}`);
    }
    if (query.startAt) {
      values.push(query.startAt);
      filters.push(`occurred_at >= $${values.length}::timestamptz`);
    }
    if (query.endAt) {
      values.push(query.endAt);
      filters.push(`occurred_at <= $${values.length}::timestamptz`);
    }

    const whereClause = filters.join(" and ");
    const countSql = `select count(*)::text as total from transactions where ${whereClause}`;
    const countResult = await this.db.query<CountRow>(countSql, values);
    const total = Number(countResult.rows[0]?.total ?? 0);

    const pagedValues = [...values, pageSize, offset];
    const result = await this.db.query<TransactionRecord>(
      `
      select id, user_id, fund_id, account_id, type, amount, description, occurred_at, idempotency_key, created_at
      from transactions
      where ${whereClause}
      order by occurred_at desc, created_at desc
      limit $${pagedValues.length - 1}
      offset $${pagedValues.length}
      `,
      pagedValues
    );

    return {
      items: result.rows,
      meta: {
        page,
        pageSize,
        total
      }
    };
  }
}
