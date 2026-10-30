import { z } from "zod";

const accountType = z.enum(["salary", "saving"]);

export const createAccountSchema = z.strictObject({
  name: z.string().max(80),
  type: accountType
});
export type CreateAccountDto = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.strictObject({
  name: z.string().max(80).optional(),
  type: accountType.optional()
});
export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;
