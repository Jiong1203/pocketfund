import type { DatabaseService } from "../../common/database";
import type { ListTransactionsQueryDto } from "./transactions.schemas";
import {
  type CreateTransactionInput,
  type CreateTransferInput,
  type PagedTransactions,
  type TransactionRecord,
  TransactionType
} from "./transactions.types";

const TRANSACTION_COLUMNS =
  "id, user_id, fund_id, account_id, type, amount, description, occurred_at, idempotency_key, transfer_group_id, created_at";

interface CountRow {
  total: string;
}

export class TransactionsRepository {
  public constructor(private readonly db: DatabaseService) {}

  public async insertTransaction(input: CreateTransactionInput): Promise<TransactionRecord> {
    const result = await this.db.query<TransactionRecord>(
      `
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
      returning ${TRANSACTION_COLUMNS}
      `,
      [
        input.userId,
        input.fundId,
        input.accountId,
        input.type,
        input.amount,
        input.description ?? null,
        input.occurredAt,
        input.idempotencyKey
      ]
    );
    return result.rows[0];
  }

  // Both legs go in one statement, so a transfer is never half-written.
  public async insertTransferPair(input: CreateTransferInput): Promise<{ from: TransactionRecord; to: TransactionRecord }> {
    const result = await this.db.query<TransactionRecord>(
      `
      insert into transactions (
        user_id,
        fund_id,
        account_id,
        type,
        amount,
        description,
        occurred_at,
        idempotency_key,
        transfer_group_id
      ) values
        ($1, $2, $4, $5, -$6::numeric, $7, $8, $9 || ':out', $10),
        ($1, $3, $4, $5, $6::numeric, $7, $8, $9 || ':in', $10)
      returning ${TRANSACTION_COLUMNS}
      `,
      [
        input.userId,
        input.fromFundId,
        input.toFundId,
        input.accountId,
        TransactionType.TRANSFER,
        input.amountAbs,
        input.description ?? null,
        input.occurredAt,
        input.idempotencyKey,
        crypto.randomUUID()
      ]
    );
    const from = result.rows.find((row) => row.fund_id === input.fromFundId)!;
    const to = result.rows.find((row) => row.fund_id === input.toFundId)!;
    return { from, to };
  }

  // Keeps both legs of a transfer in sync: each leg keeps its own sign.
  public async updateTransferGroup(
    groupId: string,
    userId: string,
    fields: { amountAbs?: number; description?: string; occurredAt?: string }
  ): Promise<TransactionRecord[]> {
    const result = await this.db.query<TransactionRecord>(
      `
      update transactions
      set amount = coalesce(sign(amount) * $3::numeric, amount),
          description = coalesce($4, description),
          occurred_at = coalesce($5::timestamptz, occurred_at)
      where transfer_group_id = $1 and user_id = $2
      returning ${TRANSACTION_COLUMNS}
      `,
      [groupId, userId, fields.amountAbs ?? null, fields.description ?? null, fields.occurredAt ?? null]
    );
    return result.rows;
  }

  public async findByIdAndUserId(id: string, userId: string): Promise<TransactionRecord | null> {
    const result = await this.db.query<TransactionRecord>(
      `select ${TRANSACTION_COLUMNS} from transactions where id = $1 and user_id = $2`,
      [id, userId]
    );
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

    const result = await this.db.query<TransactionRecord>(
      `
      update transactions
      set ${sets.join(", ")}
      where id = $${idx++} and user_id = $${idx}
      returning ${TRANSACTION_COLUMNS}
      `,
      values
    );
    return result.rows[0] ?? null;
  }

  // Deleting either leg of a transfer removes the whole transfer.
  public async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const result = await this.db.query(
      `
      delete from transactions
      where user_id = $2
        and (
          id = $1
          or transfer_group_id = (select transfer_group_id from transactions where id = $1 and user_id = $2)
        )
      `,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // Shared by fund and account transaction listings; `scope` selects which owner column to filter on.
  public async listPaged(
    userId: string,
    scope: { column: "fund_id" | "account_id"; id: string },
    query: ListTransactionsQueryDto
  ): Promise<PagedTransactions> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const filters: string[] = ["user_id = $1", `${scope.column} = $2`];
    const values: unknown[] = [userId, scope.id];

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
    const countResult = await this.db.query<CountRow>(
      `select count(*)::text as total from transactions where ${whereClause}`,
      values
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    const pagedValues = [...values, pageSize, offset];
    const result = await this.db.query<TransactionRecord>(
      `
      select ${TRANSACTION_COLUMNS},
        (
          select other.fund_id
          from transactions other
          where other.transfer_group_id = transactions.transfer_group_id and other.id <> transactions.id
          limit 1
        ) as counterpart_fund_id
      from transactions
      where ${whereClause}
      order by occurred_at desc, created_at desc
      limit $${pagedValues.length - 1}
      offset $${pagedValues.length}
      `,
      pagedValues
    );

    return { items: result.rows, meta: { page, pageSize, total } };
  }
}
