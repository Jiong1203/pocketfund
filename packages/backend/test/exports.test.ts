import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportsRepository, TransactionSheetRow } from "../src/modules/exports/exports.repository";
import { ExportsService } from "../src/modules/exports/exports.service";
import { USER, createTestApp } from "./helpers";

describe("Exports routes", () => {
  let harness: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    harness = createTestApp();
  });

  it("GET /exports returns a JSON backup for the authenticated user by default", async () => {
    const backup = { funds: [], accounts: [], transactions: [], scheduledTopUps: [] };
    harness.services.exports.buildBackup.mockResolvedValue(backup);

    const res = await harness.call("GET", "/exports");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(backup);
    expect(res.body.meta).toMatchObject({ format: "pocketfund-backup", version: 1 });
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="pocketfund-\d{4}-\d{2}-\d{2}-backup\.json"/);
    expect(harness.services.exports.buildBackup).toHaveBeenCalledWith(USER.id);
  });

  it("GET /exports?format=csv returns the transactions sheet", async () => {
    harness.services.exports.buildTransactionsCsv.mockResolvedValue("﻿日期\r\n");

    const res = await harness.call("GET", "/exports?format=csv");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    // Response.text() drops the leading BOM while decoding; the service test covers the BOM itself.
    expect(res.body).toBe("日期\r\n");
    expect(harness.services.exports.buildTransactionsCsv).toHaveBeenCalledWith(USER.id);
  });

  it("rejects unknown formats and unauthenticated requests", async () => {
    expect((await harness.call("GET", "/exports?format=xml")).status).toBe(400);
    expect((await harness.call("GET", "/exports", { token: null })).status).toBe(401);
  });
});

describe("ExportsService.buildTransactionsCsv", () => {
  const row = (overrides: Partial<TransactionSheetRow>): TransactionSheetRow => ({
    id: "tx-1",
    occurred_on: "2026-11-05",
    type: "TOP_UP",
    fund_name: "旅遊基金",
    account_name: "薪轉戶",
    amount: "1200.00",
    description: null,
    counterpart_fund_name: null,
    ...overrides
  });

  function serviceWith(rows: TransactionSheetRow[]) {
    const repository = { listTransactionSheet: vi.fn(async () => rows) };
    return new ExportsService(repository as unknown as ExportsRepository);
  }

  it("writes a BOM, a header and one line per transaction with zh-tw type labels", async () => {
    const csv = await serviceWith([
      row({}),
      row({ id: "tx-2", type: "TRANSFER", amount: "-300.00", counterpart_fund_name: "緊急預備金" })
    ]).buildTransactionsCsv("user-1");

    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual([
      "日期,類型,基金,帳戶,金額,說明,轉帳對象基金,交易 ID",
      "2026-11-05,儲值,旅遊基金,薪轉戶,1200.00,,,tx-1",
      "2026-11-05,轉帳,旅遊基金,薪轉戶,-300.00,,緊急預備金,tx-2",
      "",
      "總計",
      "項目,金額",
      "儲值合計,1200.00",
      "支出合計,0.00",
      "淨額,900.00",
      "",
      "各基金小計",
      "基金,儲值,支出,轉帳淨額,餘額",
      "旅遊基金,1200.00,0.00,-300.00,900.00",
      ""
    ]);
  });

  it("appends overall and per-fund totals summed exactly in cents", async () => {
    const csv = await serviceWith([
      row({ amount: "0.10" }),
      row({ id: "tx-2", amount: "0.20" }),
      row({ id: "tx-3", type: "EXPENSE", amount: "-0.75" }),
      row({ id: "tx-4", type: "TRANSFER", amount: "-5.00", counterpart_fund_name: "緊急預備金" }),
      row({ id: "tx-5", type: "TRANSFER", fund_name: "緊急預備金", amount: "5.00", counterpart_fund_name: "旅遊基金" }),
      row({ id: "tx-6", type: "EXPENSE", fund_name: "緊急預備金", account_name: null, amount: "-12.34" })
    ]).buildTransactionsCsv("user-1");
    const lines = csv.slice(1).split("\r\n");
    const summary = lines.slice(lines.indexOf("總計"));

    expect(summary).toEqual([
      "總計",
      "項目,金額",
      "儲值合計,0.30",
      "支出合計,-13.09",
      "淨額,-12.79",
      "",
      "各基金小計",
      "基金,儲值,支出,轉帳淨額,餘額",
      "旅遊基金,0.30,-0.75,-5.00,-5.45",
      "緊急預備金,0.00,-12.34,5.00,-7.34",
      ""
    ]);
  });

  it("omits the totals section when there are no transactions", async () => {
    const csv = await serviceWith([]).buildTransactionsCsv("user-1");
    expect(csv.slice(1)).toBe("日期,類型,基金,帳戶,金額,說明,轉帳對象基金,交易 ID\r\n");
  });

  it("quotes commas, quotes and newlines, and neutralizes formula-like text", async () => {
    const csv = await serviceWith([row({ description: '午餐, "便當"\n加飲料' }), row({ description: "=SUM(A1)" })])
      .buildTransactionsCsv("user-1");
    const lines = csv.slice(1).split("\r\n");

    expect(lines[1]).toContain(',"午餐, ""便當""\n加飲料",');
    expect(lines[2]).toContain(",'=SUM(A1),");
  });
});
