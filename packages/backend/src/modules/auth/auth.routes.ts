import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { parseInput } from "../../common/validation";
import { credentialsSchema } from "./auth.schemas";

export const authRoutes = new Hono<AppEnv>()
  .post("/register", async (c) => {
    const dto = parseInput(credentialsSchema, await c.req.json());
    return c.json({ data: await c.var.services.auth.register(dto) }, 201);
  })
  .post("/login", async (c) => {
    const dto = parseInput(credentialsSchema, await c.req.json());
    return c.json({ data: await c.var.services.auth.login(dto) }, 201);
  });
