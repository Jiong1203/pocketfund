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

export interface CreateTransferInput {
  userId: string;
  fromFundId: string;
  toFundId: string;
  accountId: string;
  amountAbs: number;
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
  transfer_group_id: string | null;
  created_at: string;
  // Only in listings: the other fund of a TRANSFER pair.
  counterpart_fund_id?: string | null;
}

export interface PagedTransactions {
  items: TransactionRecord[];
  meta: { page: number; pageSize: number; total: number };
}
