import { api } from "../lib/api";
import type {
  Account,
  AuthResult,
  Fund,
  MonthlyFlowItem,
  PagedTransactions,
  TransactionQuery
} from "../types/api";

function buildTransactionQuery(query: TransactionQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.type) params.set("type", query.type);
  if (query.startAt) params.set("startAt", query.startAt);
  if (query.endAt) params.set("endAt", query.endAt);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const pocketfundApi = {
  register(email: string, password: string): Promise<AuthResult> {
    return api.post<AuthResult>("/auth/register", { email, password }, false);
  },
  login(email: string, password: string): Promise<AuthResult> {
    return api.post<AuthResult>("/auth/login", { email, password }, false);
  },
  listAccounts(): Promise<Account[]> {
    return api.get<Account[]>("/accounts");
  },
  createAccount(name: string, type: "salary" | "saving"): Promise<Account> {
    return api.post<Account>("/accounts", { name, type });
  },
  listFunds(): Promise<Fund[]> {
    return api.get<Fund[]>("/funds");
  },
  createFund(name: string, cycleDay: number): Promise<Fund> {
    return api.post<Fund>("/funds", { name, cycleDay });
  },
  createTopUp(fundId: string, accountId: string, amount: number, description?: string): Promise<unknown> {
    return api.post(`/funds/${fundId}/top-ups`, { accountId, amount, description: description || undefined });
  },
  createExpense(fundId: string, accountId: string, amount: number, description?: string): Promise<unknown> {
    return api.post(`/funds/${fundId}/expenses`, { accountId, amount, description: description || undefined });
  },
  listFundTransactions(fundId: string, query: TransactionQuery): Promise<PagedTransactions> {
    return api.get<PagedTransactions>(`/funds/${fundId}/transactions${buildTransactionQuery(query)}`);
  },
  updateTransaction(id: string, data: { type?: string; amount?: number; description?: string; occurredAt?: string }): Promise<unknown> {
    return api.patch(`/transactions/${id}`, data);
  },
  deleteTransaction(id: string): Promise<void> {
    return api.delete(`/transactions/${id}`);
  },
  listFundMonthlyFlow(
    fundId: string,
    query: Pick<TransactionQuery, "startAt" | "endAt"> = {}
  ): Promise<MonthlyFlowItem[]> {
    return api.get<MonthlyFlowItem[]>(`/funds/${fundId}/monthly-flow${buildTransactionQuery(query)}`);
  }
};
