import type { ListTransactionsQueryDto } from "../transactions/transactions.schemas";
import type { TransactionsRepository } from "../transactions/transactions.repository";
import type { AccountsRepository } from "./accounts.repository";
import type { CreateAccountDto, UpdateAccountDto } from "./accounts.schemas";

export class AccountsService {
  public constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsRepository: TransactionsRepository
  ) {}

  public async create(userId: string, dto: CreateAccountDto) {
    return this.accountsRepository.create(userId, dto);
  }

  public async list(userId: string) {
    return this.accountsRepository.list(userId);
  }

  public async getById(userId: string, accountId: string) {
    return this.accountsRepository.getById(userId, accountId);
  }

  public async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    return this.accountsRepository.update(userId, accountId, dto);
  }

  public async delete(userId: string, accountId: string) {
    await this.accountsRepository.delete(userId, accountId);
    return { deleted: true };
  }

  public async getTransactions(userId: string, accountId: string, query: ListTransactionsQueryDto) {
    await this.accountsRepository.ensureOwned(userId, accountId);
    return this.transactionsRepository.listPaged(userId, { column: "account_id", id: accountId }, query);
  }
}
