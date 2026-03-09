import { Injectable, NestMiddleware } from "@nestjs/common";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  public use(
    req: {
      method: string;
      originalUrl: string;
      ip?: string;
      requestId?: string;
      user?: { id?: string };
      get?: (name: string) => string | undefined;
    },
    res: {
      statusCode: number;
      on: (event: "finish", cb: () => void) => void;
    },
    next: () => void
  ): void {
    const startedAt = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      const payload = {
        level: "info",
        event: "http_request",
        request_id: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status_code: res.statusCode,
        duration_ms: durationMs,
        user_id: req.user?.id ?? null,
        user_agent: req.get?.("user-agent") ?? null,
        ip: req.ip ?? null,
        at: new Date().toISOString()
      };
      console.log(JSON.stringify(payload));
    });

    next();
  }
}
