import { z } from "zod";

const password = z.string().min(6).max(72);

export const credentialsSchema = z.strictObject({
  email: z.email(),
  password
});
export type CredentialsDto = z.infer<typeof credentialsSchema>;

export const changePasswordSchema = z
  .strictObject({
    // Only checked against the stored hash, so it keeps no minimum beyond being non-empty.
    currentPassword: z.string().min(1).max(72),
    newPassword: password
  })
  .refine((dto) => dto.newPassword !== dto.currentPassword, {
    message: "New password must differ from the current password.",
    path: ["newPassword"]
  });
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
