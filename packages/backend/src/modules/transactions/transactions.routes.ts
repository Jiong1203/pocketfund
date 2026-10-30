import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { parseInput, uuidParam } from "../../common/validation";
import { updateTransactionSchema } from "./transactions.schemas";

export const transactionsRoutes = new Hono<AppEnv>()
  .patch("/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const dto = parseInput(updateTransactionSchema, await c.req.json());
    const data = await c.var.services.transactions.updateTransaction(c.var.user.id, id, dto);
    return c.json({ data });
  })
  .delete("/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    await c.var.services.transactions.deleteTransaction(c.var.user.id, id);
    return c.body(null, 204);
  });
