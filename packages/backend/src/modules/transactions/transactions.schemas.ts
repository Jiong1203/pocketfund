import { z } from "zod";
import { isoDateString, money } from "../../common/validation";
import { TransactionType } from "./transactions.types";

export const createFundTransactionSchema = z.strictObject({
  accountId: z.uuid(),
  amount: money.refine((value) => value >= 0.01, { message: "Must be at least 0.01." }),
  description: z.string().optional(),
  occurredAt: isoDateString.optional(),
  idempotencyKey: z.string().optional()
});
export type CreateFundTransactionDto = z.infer<typeof createFundTransactionSchema>;

export const createFundTransferSchema = z.strictObject({
  toFundId: z.uuid(),
  accountId: z.uuid(),
  amount: money.refine((value) => value >= 0.01, { message: "Must be at least 0.01." }),
  description: z.string().optional(),
  occurredAt: isoDateString.optional(),
  idempotencyKey: z.string().optional()
});
export type CreateFundTransferDto = z.infer<typeof createFundTransferSchema>;

export const updateTransactionSchema = z.strictObject({
  type: z.enum(TransactionType).optional(),
  amount: money.refine((value) => value >= 0.01, { message: "Must be at least 0.01." }).optional(),
  description: z.string().optional(),
  occurredAt: isoDateString.optional()
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
