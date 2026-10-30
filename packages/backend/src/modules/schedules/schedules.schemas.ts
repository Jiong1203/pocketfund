import { z } from "zod";
import { money } from "../../common/validation";

const positiveMoney = money.refine((value) => value >= 0.01, { message: "Must be at least 0.01." });
const cycleDay = z.number().int().min(1).max(31);

export const createScheduledTopUpSchema = z.strictObject({
  fundId: z.uuid(),
  accountId: z.uuid(),
  amount: positiveMoney,
  cycleDay,
  description: z.string().max(255).optional()
});
export type CreateScheduledTopUpDto = z.infer<typeof createScheduledTopUpSchema>;

export const updateScheduledTopUpSchema = z.strictObject({
  accountId: z.uuid().optional(),
  amount: positiveMoney.optional(),
  cycleDay: cycleDay.optional(),
  description: z.string().max(255).optional(),
  isActive: z.boolean().optional()
});
export type UpdateScheduledTopUpDto = z.infer<typeof updateScheduledTopUpSchema>;
