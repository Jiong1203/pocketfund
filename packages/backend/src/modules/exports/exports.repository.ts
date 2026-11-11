import type { DatabaseService } from "../../common/database";
import { APP_TIME_ZONE } from "../../common/time";

// Rows are exported without user_id so a backup is portable between accounts.
export interface ExportFundRow {
  id: string;
  name: string;
  description: string | null;
  monthly_amount: string | null;
  cycle_type: string;
  cycle_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportAccountRow {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface ExportTransactionRow {
  id: string;
  fund_id: string;
  account_id: string | null;
  type: string;
  amount: string;
  description: string | null;
  occurred_at: string;
  idempotency_key: string;
  transfer_group_id: string | null;
  created_at: string;
}

export interface ExportScheduleRow {
  id: string;
  fund_id: string;
  account_id: string;
  amount: string;
  cycle_day: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// One spreadsheet-friendly line per transaction, with names resolved and the date in Taiwan time.
export interface TransactionSheetRow {
  id: string;
  occurred_on: string;
  type: string;
  fund_name: string;
  account_name: string | null;
  amount: string;
  description: string | null;
  counterpart_fund_name: string | null;
}

export class ExportsRepository {
  public constructor(private readonly db: DatabaseService) {}

  public async listFunds(userId: string): Promise<ExportFundRow[]> {
    const result = await this.db.query<ExportFundRow>(
      `
      select id, name, description, monthly_amount, cycle_type, cycle_day, is_active, created_at, updated_at
      from funds
      where user_id = $1
      order by created_at asc
      `,
      [userId]
    );
    return result.rows;
  }

  public async listAccounts(userId: string): Promise<ExportAccountRow[]> {
    const result = await this.db.query<ExportAccountRow>(
      `
      select id, name, type, created_at, updated_at
      from accounts
      where user_id = $1
      order by created_at asc
      `,
      [userId]
    );
    return result.rows;
  }

  public async listTransactions(userId: string): Promise<ExportTransactionRow[]> {
    const result = await this.db.query<ExportTransactionRow>(
      `
      select id, fund_id, account_id, type, amount, description, occurred_at,
        idempotency_key, transfer_group_id, created_at
      from transactions
      where user_id = $1
      order by occurred_at asc, created_at asc
      `,
      [userId]
    );
    return result.rows;
  }

  public async listSchedules(userId: string): Promise<ExportScheduleRow[]> {
    const result = await this.db.query<ExportScheduleRow>(
      `
      select id, fund_id, account_id, amount, cycle_day, description, is_active, created_at, updated_at
      from scheduled_topups
      where user_id = $1
      order by created_at asc
      `,
      [userId]
    );
    return result.rows;
  }

  public async listTransactionSheet(userId: string): Promise<TransactionSheetRow[]> {
    const result = await this.db.query<TransactionSheetRow>(
      `
      select
        t.id,
        to_char(t.occurred_at at time zone '${APP_TIME_ZONE}', 'YYYY-MM-DD') as occurred_on,
        t.type,
        f.name as fund_name,
        a.name as account_name,
        t.amount::text as amount,
        t.description,
        cf.name as counterpart_fund_name
      from transactions t
      join funds f on f.id = t.fund_id
      left join accounts a on a.id = t.account_id
      left join transactions other
        on other.transfer_group_id = t.transfer_group_id and other.id <> t.id
      left join funds cf on cf.id = other.fund_id
      where t.user_id = $1
      order by t.occurred_at asc, t.created_at asc
      `,
      [userId]
    );
    return result.rows;
  }
}
