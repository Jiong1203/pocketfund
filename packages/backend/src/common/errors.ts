import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface AppErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  public constructor(
    payload: AppErrorPayload,
    public readonly status: ContentfulStatusCode = 400
  ) {
    super(payload.message);
    this.code = payload.code;
    this.details = payload.details;
  }

  public toBody(): { error: AppErrorPayload } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details === undefined ? {} : { details: this.details })
      }
    };
  }
}

export const notFound = (message: string): AppError =>
  new AppError({ code: "RESOURCE_NOT_FOUND", message }, 404);

export const unauthorized = (message: string): AppError =>
  new AppError({ code: "AUTH_UNAUTHORIZED", message }, 401);
