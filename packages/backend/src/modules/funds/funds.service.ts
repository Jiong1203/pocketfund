import { HttpStatus, Injectable } from "@nestjs/common";
import { AppException } from "../../common/errors/app-exception";
import { AccountsRepository } from "../accounts/accounts.repository";
import { CreateFundTransactionDto } from "../transactions/dto/create-fund-transaction.dto";
import { ListTransactionsQueryDto } from "../transactions/dto/list-transactions-query.dto";
import { TransactionType } from "../transactions/transaction-type.enum";
import { TransactionsService } from "../transactions/transactions.service";
import { CreateFundDto } from "./dto/create-fund.dto";
import { MonthlyFlowQueryDto } from "./dto/monthly-flow-query.dto";
import { UpdateFundDto } from "./dto/update-fund.dto";
import { FundsRepository } from "./funds.repository";

@Injectable()
export class FundsService {
  public constructor(
    private readonly fundsRepository: FundsRepository,
    private readonly accountsRepository: AccountsRepository,
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
    await this.fundsRepository.ensureFundExists(userId, fundId);
    await this.accountsRepository.ensureOwned(userId, dto.accountId);
    return this.transactionsService.createLedgerTransaction({
      userId,
      fundId,
      accountId: dto.accountId,
      type: TransactionType.TOP_UP,
      amountAbs: dto.amount,
      description: dto.description,
      occurredAt: dto.occurredAt,
      idempotencyKey: dto.idempotencyKey
    });
  }

  public async expense(userId: string, fundId: string, dto: CreateFundTransactionDto) {
    await this.fundsRepository.ensureFundExists(userId, fundId);
    await this.accountsRepository.ensureOwned(userId, dto.accountId);
    const currentBalance = await this.fundsRepository.getFundBalance(userId, fundId);

    if (currentBalance - dto.amount < 0) {
      throw new AppException(
        {
          code: "LEDGER_INSUFFICIENT_BALANCE",
          message: "Insufficient fund balance."
        },
        HttpStatus.CONFLICT
      );
    }

    return this.transactionsService.createLedgerTransaction({
      userId,
      fundId,
      accountId: dto.accountId,
      type: TransactionType.EXPENSE,
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
    return this.fundsRepository.getFundTransactions(userId, fundId, query);
  }

  public async getMonthlyFlow(userId: string, fundId: string, query: MonthlyFlowQueryDto) {
    await this.fundsRepository.ensureFundExists(userId, fundId);
    return this.fundsRepository.getFundMonthlyFlow(userId, fundId, query);
  }
}
