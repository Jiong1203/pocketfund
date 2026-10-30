import type { AccountsRepository } from "../accounts/accounts.repository";
import type { TransactionsRepository } from "../transactions/transactions.repository";
import type {
  CreateFundTransactionDto,
  CreateFundTransferDto,
  ListTransactionsQueryDto
} from "../transactions/transactions.schemas";
import type { TransactionsService } from "../transactions/transactions.service";
import { TransactionType } from "../transactions/transactions.types";
import type { FundsRepository } from "./funds.repository";
import type { CreateFundDto, MonthlyFlowQueryDto, UpdateFundDto } from "./funds.schemas";

export class FundsService {
  public constructor(
    private readonly fundsRepository: FundsRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly transactionsService: TransactionsService
  ) {}

  public async create(userId: string, dto: CreateFundDto) {
    return this.fundsRepository.create(userId, dto);
  }

  public async list(userId: string) {
    return this.fundsRepository.list(userId);
  }

  public async getById(userId: string, fundId: string) {
    return this.fundsRepository.getById(userId, fundId);
  }

  public async update(userId: string, fundId: string, dto: UpdateFundDto) {
    return this.fundsRepository.update(userId, fundId, dto);
  }

  public async delete(userId: string, fundId: string) {
    await this.fundsRepository.delete(userId, fundId);
    return { deleted: true };
  }

  public async topUp(userId: string, fundId: string, dto: CreateFundTransactionDto) {
    return this.postToFund(userId, fundId, TransactionType.TOP_UP, dto);
  }

  public async expense(userId: string, fundId: string, dto: CreateFundTransactionDto) {
    return this.postToFund(userId, fundId, TransactionType.EXPENSE, dto);
  }

  public async transfer(userId: string, fromFundId: string, dto: CreateFundTransferDto) {
    await this.fundsRepository.ensureFundExists(userId, fromFundId);
    await this.fundsRepository.ensureFundExists(userId, dto.toFundId);
    await this.accountsRepository.ensureOwned(userId, dto.accountId);
    return this.transactionsService.createFundTransfer({
      userId,
      fromFundId,
      toFundId: dto.toFundId,
      accountId: dto.accountId,
      amountAbs: dto.amount,
      description: dto.description,
      occurredAt: dto.occurredAt,
      idempotencyKey: dto.idempotencyKey
    });
  }

  public async getBalance(userId: string, fundId: string): Promise<{ fundId: string; balance: number }> {
    await this.fundsRepository.ensureFundExists(userId, fundId);
    const balance = await this.fundsRepository.getFundBalance(userId, fundId);
    return { fundId, balance };
  }

  public async getTransactions(userId: string, fundId: string, query: ListTransactionsQueryDto) {
    await this.fundsRepository.ensureFundExists(userId, fundId);
    return this.transactionsRepository.listPaged(userId, { column: "fund_id", id: fundId }, query);
  }

  public async getMonthlyFlow(userId: string, fundId: string, query: MonthlyFlowQueryDto) {
    await this.fundsRepository.ensureFundExists(userId, fundId);
    return this.fundsRepository.getFundMonthlyFlow(userId, fundId, query);
  }

  private async postToFund(
    userId: string,
    fundId: string,
    type: TransactionType.TOP_UP | TransactionType.EXPENSE,
    dto: CreateFundTransactionDto
  ) {
    await this.fundsRepository.ensureFundExists(userId, fundId);
    await this.accountsRepository.ensureOwned(userId, dto.accountId);
    return this.transactionsService.createLedgerTransaction({
      userId,
      fundId,
      accountId: dto.accountId,
      type,
      amountAbs: dto.amount,
      description: dto.description,
      occurredAt: dto.occurredAt,
      idempotencyKey: dto.idempotencyKey
    });
  }
}
