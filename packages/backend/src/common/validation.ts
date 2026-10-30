import { z } from "zod";
import { AppError } from "./errors";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export const isoDateString = z
  .string()
  .refine((value) => ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value)), {
    message: "Must be an ISO 8601 date string."
  });

// Money: positive-or-zero numbers with at most 2 decimal places (stored as numeric(14,2)).
export const money = z
  .number()
  .refine((value) => Number.isFinite(value) && /^-?\d+(\.\d{1,2})?$/.test(String(value)), {
    message: "Must have at most 2 decimal places."
  });

export const uuidParam = z.object({ id: z.uuid() });

export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(
      {
        code: "VALIDATION_ERROR",
        message: "Validation failed.",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      400
    );
  }
  return result.data;
}
