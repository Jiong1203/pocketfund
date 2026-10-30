export enum TransactionType {
  TOP_UP = "TOP_UP",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER"
}

export interface CreateTransactionInput {
  userId: string;
  fundId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  occurredAt: string;
  idempotencyKey: string;
}

export interface TransactionRecord {
  id: string;
  user_id: string;
  fund_id: string;
  account_id: string;
  type: TransactionType;
  amount: string;
  description: string | null;
  occurred_at: string;
  idempotency_key: string;
  created_at: string;
}

export interface PagedTransactions {
  items: TransactionRecord[];
  meta: { page: number; pageSize: number; total: number };
}
