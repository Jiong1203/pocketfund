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
}
