export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface UserInfo {
  id: string;
  email: string;
}

export interface AuthResult {
  accessToken: string;
  user: UserInfo;
}

export interface Account {
  id: string;
  name: string;
  type: "salary" | "saving";
}

export interface Fund {
  id: string;
  name: string;
  cycle_day: number;
}

export interface TransactionRecord {
  id: string;
  type: "TOP_UP" | "EXPENSE" | "ADJUST" | "TRANSFER";
  amount: string;
  description: string | null;
  occurred_at: string;
}

export interface PagedTransactions {
  items: TransactionRecord[];
  meta: ApiMeta;
}

export interface TransactionQuery {
  page?: number;
  pageSize?: number;
  type?: "TOP_UP" | "EXPENSE" | "ADJUST" | "TRANSFER" | "";
  startAt?: string;
  endAt?: string;
}

export interface MonthlyFlowItem {
  month: string;
  topUp: number;
  expense: number;
}
