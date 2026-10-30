import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { parseInput, uuidParam } from "../../common/validation";
import {
  createFundTransactionSchema,
  createFundTransferSchema,
  listTransactionsQuerySchema
} from "../transactions/transactions.schemas";
import { createFundSchema, monthlyFlowQuerySchema, updateFundSchema } from "./funds.schemas";

export const fundsRoutes = new Hono<AppEnv>()
  .post("/", async (c) => {
    const dto = parseInput(createFundSchema, await c.req.json());
    return c.json({ data: await c.var.services.funds.create(c.var.user.id, dto) }, 201);
  })
  .get("/", async (c) => {
    return c.json({ data: await c.var.services.funds.list(c.var.user.id) });
  })
  .get("/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    return c.json({ data: await c.var.services.funds.getById(c.var.user.id, id) });
  })
  .patch("/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const dto = parseInput(updateFundSchema, await c.req.json());
    return c.json({ data: await c.var.services.funds.update(c.var.user.id, id, dto) });
  })
  .delete("/:id", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    return c.json({ data: await c.var.services.funds.delete(c.var.user.id, id) });
  })
  .post("/:id/top-ups", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const dto = parseInput(createFundTransactionSchema, await c.req.json());
    return c.json({ data: await c.var.services.funds.topUp(c.var.user.id, id, dto) }, 201);
  })
  .post("/:id/expenses", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const dto = parseInput(createFundTransactionSchema, await c.req.json());
    return c.json({ data: await c.var.services.funds.expense(c.var.user.id, id, dto) }, 201);
  })
  .post("/:id/transfers", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const dto = parseInput(createFundTransferSchema, await c.req.json());
    return c.json({ data: await c.var.services.funds.transfer(c.var.user.id, id, dto) }, 201);
  })
  .get("/:id/balance", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    return c.json({ data: await c.var.services.funds.getBalance(c.var.user.id, id) });
  })
  .get("/:id/transactions", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const query = parseInput(listTransactionsQuerySchema, c.req.query());
    return c.json({ data: await c.var.services.funds.getTransactions(c.var.user.id, id, query) });
  })
  .get("/:id/monthly-flow", async (c) => {
    const { id } = parseInput(uuidParam, c.req.param());
    const query = parseInput(monthlyFlowQuerySchema, c.req.query());
    return c.json({ data: await c.var.services.funds.getMonthlyFlow(c.var.user.id, id, query) });
  });
