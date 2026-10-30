import { Hono, type MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import type { AppEnv } from "./app-env";
import { AppError, unauthorized } from "./common/errors";
import { openServiceScope, type ServiceScope } from "./container";
import { accountsRoutes } from "./modules/accounts/accounts.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { fundsRoutes } from "./modules/funds/funds.routes";
import { schedulesRoutes } from "./modules/schedules/schedules.routes";
import { transactionsRoutes } from "./modules/transactions/transactions.routes";

export interface AppDeps {
  openServiceScope(env: Env): ServiceScope;
}

export function createApp(deps: AppDeps = { openServiceScope }) {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(requestLogger);

  app.get("/health", (c) =>
    c.json({ status: "ok", timestamp: new Date().toISOString(), service: "pocketfund-backend" })
  );

  app.use(async (c, next) => {
    const scope = deps.openServiceScope(c.env);
    c.set("services", scope.services);
    try {
      await next();
    } finally {
      c.executionCtx.waitUntil(scope.close());
    }
  });

  for (const path of ["/accounts/*", "/funds/*", "/transactions/*", "/schedules/*"]) {
    app.use(path, requireAuth);
  }

  app.route("/auth", authRoutes);
  app.route("/accounts", accountsRoutes);
  app.route("/funds", fundsRoutes);
  app.route("/transactions", transactionsRoutes);
  app.route("/schedules", schedulesRoutes);

  app.notFound((c) => c.json({ error: { code: "RESOURCE_NOT_FOUND", message: "Route not found." } }, 404));

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(err.toBody(), err.status);
    }
    if (err instanceof SyntaxError) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "Malformed JSON body." } }, 400);
    }
    if (err instanceof HTTPException) {
      return c.json({ error: { code: "SYSTEM_HTTP_ERROR", message: err.message } }, err.status);
    }

    console.error(
      JSON.stringify({
        level: "error",
        event: "unhandled_error",
        request_id: c.var.requestId,
        method: c.req.method,
        path: c.req.path,
        error: err.message,
        stack: err.stack
      })
    );
    return c.json({ error: { code: "SYSTEM_INTERNAL_ERROR", message: "Internal server error." } }, 500);
  });

  return app;
}

const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authorization = c.req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw unauthorized("Missing bearer token.");
  }
  const token = authorization.slice("Bearer ".length).trim();
  c.set("user", await c.var.services.auth.verifyAccessToken(token));
  await next();
};

const requestLogger: MiddlewareHandler<AppEnv> = async (c, next) => {
  const startedAt = Date.now();
  await next();
  console.log(
    JSON.stringify({
      level: "info",
      event: "http_request",
      request_id: c.var.requestId,
      method: c.req.method,
      path: c.req.path,
      status_code: c.res.status,
      duration_ms: Date.now() - startedAt,
      user_id: c.var.user?.id ?? null,
      user_agent: c.req.header("user-agent") ?? null,
      at: new Date().toISOString()
    })
  );
};
