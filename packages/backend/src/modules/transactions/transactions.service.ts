import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { AppException } from "../../common/errors/app-exception";
import { TransactionType } from "./transaction-type.enum";
import { TransactionsRepository } from "./transactions.repository";
import { TransactionRecord } from "./transactions.types";

interface UpdateTransactionParams {
  type?: TransactionType;
  amount?: number;
  description?: string;
  occurredAt?: string;
}

interface CreateLedgerTransactionParams {
  userId: string;
  fundId: string;
  accountId: string;
  type: TransactionType;
  amountAbs: number;
  description?: string;
  occurredAt?: string;
  idempotencyKey?: string;
}

@Injectable()
export class TransactionsService {
  public constructor(private readonly transactionsRepository: TransactionsRepository) {}

  public async createLedgerTransaction(
    params: CreateLedgerTransactionParams
  ): Promise<TransactionRecord> {
    const signedAmount = this.applyAmountSign(params.type, params.amountAbs);
    const occurredAt = params.occurredAt ?? new Date().toISOString();

    try {
      return await this.transactionsRepository.insertTransaction({
        userId: params.userId,
        fundId: params.fundId,
        accountId: params.accountId,
        type: params.type,
        amount: signedAmount,
        description: params.description,
        occurredAt,
        idempotencyKey: params.idempotencyKey ?? randomUUID()
      });
    } catch (error) {
      const typedError = error as { code?: string };
      if (typedError.code === "23505") {
        throw new AppException(
          {
            code: "LEDGER_DUPLICATE_TRANSACTION",
            message: "Duplicate transaction request."
          },
          HttpStatus.CONFLICT
        );
      }
      throw error;
    }
  }

  public async updateTransaction(
    userId: string,
    id: string,
    params: UpdateTransactionParams
  ): Promise<TransactionRecord> {
    const existing = await this.transactionsRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new AppException(
        { code: "LEDGER_NOT_FOUND", message: "Transaction not found." },
        HttpStatus.NOT_FOUND
      );
    }

    const updated = await this.transactionsRepository.updateTransaction(id, userId, params);
    if (!updated) {
      throw new AppException(
        { code: "VALIDATION_NO_FIELDS", message: "No updatable fields provided." },
        HttpStatus.BAD_REQUEST
      );
    }
    return updated;
  }

  public async deleteTransaction(userId: string, id: string): Promise<void> {
    const deleted = await this.transactionsRepository.deleteTransaction(id, userId);
    if (!deleted) {
      throw new AppException(
        { code: "LEDGER_NOT_FOUND", message: "Transaction not found." },
        HttpStatus.NOT_FOUND
      );
    }
  }

  private applyAmountSign(type: TransactionType, amountAbs: number): number {
    if (type === TransactionType.TOP_UP) {
      return Math.abs(amountAbs);
    }
    if (type === TransactionType.EXPENSE) {
      return -Math.abs(amountAbs);
    }
    return amountAbs;
  }
}
