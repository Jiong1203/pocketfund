import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(
    req: { headers: Record<string, string | undefined>; requestId?: string },
    res: { setHeader: (key: string, value: string) => void },
    next: () => void
  ): void {
    const incoming = req.headers["x-request-id"];
    const requestId = incoming && incoming.trim().length > 0 ? incoming : randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  }
}
