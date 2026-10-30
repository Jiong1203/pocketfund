import { AppError } from "../../common/errors";
import type { TransactionsRepository } from "./transactions.repository";
import { type TransactionRecord, TransactionType } from "./transactions.types";

interface UpdateTransactionParams {
  type?: TransactionType;
  amount?: number;
  description?: string;
  occurredAt?: string;
}

export interface CreateLedgerTransactionParams {
  userId: string;
  fundId: string;
  accountId: string;
  type: TransactionType;
  amountAbs: number;
  description?: string;
  occurredAt?: string;
  idempotencyKey?: string;
}

const PG_UNIQUE_VIOLATION = "23505";

export class TransactionsService {
  public constructor(private readonly transactionsRepository: TransactionsRepository) {}

  public async createLedgerTransaction(params: CreateLedgerTransactionParams): Promise<TransactionRecord> {
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
        idempotencyKey: params.idempotencyKey ?? crypto.randomUUID()
      });
    } catch (error) {
      if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) {
        throw new AppError(
          { code: "LEDGER_DUPLICATE_TRANSACTION", message: "Duplicate transaction request." },
          409
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
      throw new AppError({ code: "LEDGER_NOT_FOUND", message: "Transaction not found." }, 404);
    }

    // Clients send amounts as positive values; re-apply the sign rule whenever amount or type changes
    // so an edited EXPENSE stays negative (and a type switch flips the stored sign).
    const fields = { ...params };
    if (params.amount !== undefined || params.type !== undefined) {
      const type = params.type ?? existing.type;
      fields.amount = this.applyAmountSign(type, params.amount ?? Number(existing.amount));
    }

    const updated = await this.transactionsRepository.updateTransaction(id, userId, fields);
    if (!updated) {
      throw new AppError({ code: "VALIDATION_NO_FIELDS", message: "No updatable fields provided." }, 400);
    }
    return updated;
  }

  public async deleteTransaction(userId: string, id: string): Promise<void> {
    const deleted = await this.transactionsRepository.deleteTransaction(id, userId);
    if (!deleted) {
      throw new AppError({ code: "LEDGER_NOT_FOUND", message: "Transaction not found." }, 404);
    }
  }

  private applyAmountSign(type: TransactionType, amountAbs: number): number {
    if (type === TransactionType.TOP_UP) return Math.abs(amountAbs);
    if (type === TransactionType.EXPENSE) return -Math.abs(amountAbs);
    return amountAbs;
  }
}
