import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { CreateTransactionInput, TransactionRecord } from "./transactions.types";

@Injectable()
export class TransactionsRepository {
  public constructor(private readonly db: DatabaseService) {}

  public async insertTransaction(input: CreateTransactionInput): Promise<TransactionRecord> {
    const sql = `
      insert into transactions (
        user_id,
        fund_id,
        account_id,
        type,
        amount,
        description,
        occurred_at,
        idempotency_key
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning id, user_id, fund_id, account_id, type, amount, description, occurred_at, idempotency_key, created_at
    `;

    const result = await this.db.query<TransactionRecord>(sql, [
      input.userId,
      input.fundId,
      input.accountId,
      input.type,
      input.amount,
      input.description ?? null,
      input.occurredAt,
      input.idempotencyKey
    ]);

    return result.rows[0];
  }

  public async findByIdAndUserId(id: string, userId: string): Promise<TransactionRecord | null> {
    const sql = `
      select id, user_id, fund_id, account_id, type, amount, description, occurred_at, idempotency_key, created_at
      from transactions
      where id = $1 and user_id = $2
    `;
    const result = await this.db.query<TransactionRecord>(sql, [id, userId]);
    return result.rows[0] ?? null;
  }

  public async updateTransaction(
    id: string,
    userId: string,
    fields: { type?: string; amount?: number; description?: string; occurredAt?: string }
  ): Promise<TransactionRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (fields.type !== undefined) {
      sets.push(`type = $${idx++}`);
      values.push(fields.type);
    }
    if (fields.amount !== undefined) {
      sets.push(`amount = $${idx++}`);
      values.push(fields.amount);
    }
    if (fields.description !== undefined) {
      sets.push(`description = $${idx++}`);
      values.push(fields.description);
    }
    if (fields.occurredAt !== undefined) {
      sets.push(`occurred_at = $${idx++}`);
      values.push(fields.occurredAt);
    }
    if (sets.length === 0) return null;

    values.push(id, userId);

    const sql = `
      update transactions
      set ${sets.join(", ")}
      where id = $${idx++} and user_id = $${idx}
      returning id, user_id, fund_id, account_id, type, amount, description, occurred_at, idempotency_key, created_at
    `;

    const result = await this.db.query<TransactionRecord>(sql, values);
    return result.rows[0] ?? null;
  }

  public async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const sql = `delete from transactions where id = $1 and user_id = $2`;
    const result = await this.db.query(sql, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}
