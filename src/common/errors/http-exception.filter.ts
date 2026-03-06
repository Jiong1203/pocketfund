import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();

    const status = this.resolveStatus(exception);
    const error = this.resolveErrorBody(exception, status);

    response.status(status).json({ error });
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveErrorBody(exception: unknown, status: number): ErrorBody {
    if (exception instanceof HttpException) {
      const raw = exception.getResponse();
      if (typeof raw === "object" && raw !== null) {
        const asRecord = raw as Record<string, unknown>;
        if (typeof asRecord.code === "string" && typeof asRecord.message === "string") {
          return {
            code: asRecord.code,
            message: asRecord.message,
            details: asRecord.details
          };
        }

        if (Array.isArray(asRecord.message)) {
          return {
            code: "VALIDATION_ERROR",
            message: "Validation failed.",
            details: asRecord.message
          };
        }
      }

      return {
        code: this.defaultCodeByStatus(status),
        message: exception.message
      };
    }

    return {
      code: "SYSTEM_INTERNAL_ERROR",
      message: "Internal server error."
    };
  }

  private defaultCodeByStatus(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return "VALIDATION_ERROR";
    if (status === HttpStatus.UNAUTHORIZED) return "AUTH_UNAUTHORIZED";
    if (status === HttpStatus.FORBIDDEN) return "AUTH_FORBIDDEN";
    if (status === HttpStatus.NOT_FOUND) return "RESOURCE_NOT_FOUND";
    if (status === HttpStatus.CONFLICT) return "LEDGER_CONFLICT";
    return "SYSTEM_HTTP_ERROR";
  }
}
