import { Hono } from "hono";
import type { AppEnv } from "../../app-env";
import { toAppCalendarDay } from "../../common/time";
import { parseInput } from "../../common/validation";
import { exportQuerySchema } from "./exports.schemas";
import { BACKUP_FORMAT, BACKUP_VERSION } from "./exports.service";

// GET /exports?format=json  -> full backup ({ data, meta })
// GET /exports?format=csv   -> transactions as a spreadsheet
export const exportsRoutes = new Hono<AppEnv>().get("/", async (c) => {
  const { format } = parseInput(exportQuerySchema, c.req.query());
  const now = new Date();
  const fileStem = `pocketfund-${toAppCalendarDay(now).isoDate}`;
  c.header("Cache-Control", "no-store");

  if (format === "csv") {
    const csv = await c.var.services.exports.buildTransactionsCsv(c.var.user.id);
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${fileStem}-transactions.csv"`);
    return c.body(csv);
  }

  const data = await c.var.services.exports.buildBackup(c.var.user.id);
  c.header("Content-Disposition", `attachment; filename="${fileStem}-backup.json"`);
  return c.json({
    data,
    meta: { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString() }
  });
});
