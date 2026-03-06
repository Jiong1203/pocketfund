import { HttpException, HttpStatus } from "@nestjs/common";

export interface AppErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class AppException extends HttpException {
  public constructor(
    payload: AppErrorPayload,
    status: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super(payload, status);
  }
}
