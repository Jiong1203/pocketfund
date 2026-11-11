import { z } from "zod";
import { isoDateString, money } from "../../common/validation";
import { TransactionType } from "./transactions.types";

const positiveAmount = money.refine((value) => value >= 0.01, { message: "Must be at least 0.01." });

const postingFields = {
  amount: positiveAmount,
  description: z.string().optional(),
  occurredAt: isoDateString.optional(),
  idempotencyKey: z.string().optional()
};

// A top-up must say which account the money came from.
export const createTopUpSchema = z.strictObject({
  accountId: z.uuid(),
  ...postingFields
});
export type CreateTopUpDto = z.infer<typeof createTopUpSchema>;

// Expenses and transfers only move money out of / between funds, so the account is optional
// (still accepted, and stored, for clients that send one).
export const createExpenseSchema = z.strictObject({
  accountId: z.uuid().optional(),
  ...postingFields
});
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;

export const createFundTransferSchema = z.strictObject({
  toFundId: z.uuid(),
  accountId: z.uuid().optional(),
  ...postingFields
});
export type CreateFundTransferDto = z.infer<typeof createFundTransferSchema>;

export const updateTransactionSchema = z.strictObject({
  type: z.enum(TransactionType).optional(),
  amount: positiveAmount.optional(),
  description: z.string().optional(),
  occurredAt: isoDateString.optional(),
  // Needed when an account-less EXPENSE is changed into a TOP_UP.
  accountId: z.uuid().optional()
});
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  type: z.enum(TransactionType).optional(),
  startAt: isoDateString.optional(),
  endAt: isoDateString.optional()
});
export type ListTransactionsQueryDto = z.infer<typeof listTransactionsQuerySchema>;
