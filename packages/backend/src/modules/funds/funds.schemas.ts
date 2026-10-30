import { z } from "zod";
import { isoDateString, money } from "../../common/validation";

const nonNegativeMoney = money.refine((value) => value >= 0, { message: "Must not be negative." });
const cycleDay = z.number().int().min(1).max(31);

export const createFundSchema = z.strictObject({
  name: z.string().max(80),
  description: z.string().max(255).optional(),
  monthlyAmount: nonNegativeMoney.optional(),
  cycleDay: cycleDay.optional(),
  isActive: z.boolean().optional()
});
export type CreateFundDto = z.infer<typeof createFundSchema>;

export const updateFundSchema = createFundSchema.partial();
export type UpdateFundDto = z.infer<typeof updateFundSchema>;

export const monthlyFlowQuerySchema = z.object({
  startAt: isoDateString.optional(),
  endAt: isoDateString.optional()
});
export type MonthlyFlowQueryDto = z.infer<typeof monthlyFlowQuerySchema>;
