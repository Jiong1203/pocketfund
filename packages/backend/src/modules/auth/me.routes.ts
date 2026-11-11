import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { parseInput } from "../../common/validation";
import { changePasswordSchema } from "./auth.schemas";

// The signed-in user's own profile (requires a bearer token).
export const meRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    return c.json({ data: await c.var.services.auth.getProfile(c.var.user.id) });
  })
  .put("/password", async (c) => {
    const dto = parseInput(changePasswordSchema, await c.req.json());
    await c.var.services.auth.changePassword(c.var.user.id, dto);
    return c.body(null, 204);
  });
