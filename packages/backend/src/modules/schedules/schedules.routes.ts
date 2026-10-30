import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { parseInput, uuidParam } from "../../common/validation";
import { createScheduledTopUpSchema, updateScheduledTopUpSchema } from "./schedules.schemas";

export const schedulesRoutes = new Hono<AppEnv>()
  .post("/top-ups", async (c) => {
    const dto = parseInput(createScheduledTopUpSchema, await c.req.json());
    return c.json({ data: await c.var.services.schedules.create(c.var.user.id, dto) }, 201);
  })
  .get("/top-ups", async (c) => {
    return c.json({ data: await c.var.services.schedules.list(c.var.user.id) });
  })
  .patch("/top-ups/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const dto = parseInput(updateScheduledTopUpSchema, await c.req.json());
    return c.json({ data: await c.var.services.schedules.update(c.var.user.id, id, dto) });
  })
  .delete("/top-ups/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    return c.json({ data: await c.var.services.schedules.delete(c.var.user.id, id) });
  });
