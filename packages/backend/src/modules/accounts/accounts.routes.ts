import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { parseInput, uuidParam } from "../../common/validation";
import { listTransactionsQuerySchema } from "../transactions/transactions.schemas";
import { createAccountSchema, updateAccountSchema } from "./accounts.schemas";

export const accountsRoutes = new Hono<AppEnv>()
  .post("/", async (c) => {
    const dto = parseInput(createAccountSchema, await c.req.json());
    return c.json({ data: await c.var.services.accounts.create(c.var.user.id, dto) }, 201);
  })
  .get("/", async (c) => {
    return c.json({ data: await c.var.services.accounts.list(c.var.user.id) });
  })
  .get("/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    return c.json({ data: await c.var.services.accounts.getById(c.var.user.id, id) });
  })
  .patch("/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const dto = parseInput(updateAccountSchema, await c.req.json());
    return c.json({ data: await c.var.services.accounts.update(c.var.user.id, id, dto) });
  })
  .delete("/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    return c.json({ data: await c.var.services.accounts.delete(c.var.user.id, id) });
  })
  .get("/:id/transactions", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const query = parseInput(listTransactionsQuerySchema, c.req.query());
    return c.json({ data: await c.var.services.accounts.getTransactions(c.var.user.id, id, query) });
  });
