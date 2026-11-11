export enum TransactionType {
  TOP_UP = "TOP_UP",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER"
}

export interface CreateTransactionInput {
  userId: string;
  fundId: string;
  accountId: string | null;
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
  accountId: string | null;
  amountAbs: number;
  description?: string;
  occurredAt: string;
  idempotencyKey: string;
}

export interface TransactionRecord {
  id: string;
  user_id: string;
  fund_id: string;
  // Required for TOP_UP; expenses and transfers may have none.
  account_id: string | null;
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
