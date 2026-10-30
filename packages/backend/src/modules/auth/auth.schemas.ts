import { z } from "zod";

export const credentialsSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(6).max(72)
});
export type CredentialsDto = z.infer<typeof credentialsSchema>;
