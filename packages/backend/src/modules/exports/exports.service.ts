import type {
  ExportAccountRow,
  ExportFundRow,
  ExportScheduleRow,
  ExportTransactionRow,
  ExportsRepository,
  TransactionSheetRow
} from "./exports.repository";

export const BACKUP_FORMAT = "pocketfund-backup";
export const BACKUP_VERSION = 1;

export interface LedgerBackup {
  funds: ExportFundRow[];
  accounts: ExportAccountRow[];
  transactions: ExportTransactionRow[];
  scheduledTopUps: ExportScheduleRow[];
}

const TYPE_LABELS: Record<string, string> = {
  TOP_UP: "儲值",
  EXPENSE: "支出",
  TRANSFER: "轉帳"
};

const CSV_HEADER = ["日期", "類型", "基金", "帳戶", "金額", "說明", "轉帳對象基金", "交易 ID"];

// Excel needs a UTF-8 BOM to open Chinese text correctly.
const UTF8_BOM = "﻿";

export class ExportsService {
  public constructor(private readonly exportsRepository: ExportsRepository) {}

  // Full backup of everything the user owns; amounts stay as exact decimal strings.
  public async buildBackup(userId: string): Promise<LedgerBackup> {
    const [funds, accounts, transactions, scheduledTopUps] = await Promise.all([
      this.exportsRepository.listFunds(userId),
      this.exportsRepository.listAccounts(userId),
      this.exportsRepository.listTransactions(userId),
      this.exportsRepository.listSchedules(userId)
    ]);
    return { funds, accounts, transactions, scheduledTopUps };
  }

  public async buildTransactionsCsv(userId: string): Promise<string> {
    const rows = await this.exportsRepository.listTransactionSheet(userId);
    const records = [CSV_HEADER, ...rows.map(toCsvRecord)];
    if (rows.length > 0) {
      records.push([], ...buildSummaryRecords(rows));
    }
    const lines = records.map((fields) => fields.map(escapeCsvField).join(","));
    return UTF8_BOM + lines.join("\r\n") + "\r\n";
  }
}

function toCsvRecord(row: TransactionSheetRow): string[] {
  return [
    row.occurred_on,
    TYPE_LABELS[row.type] ?? row.type,
    neutralizeFormula(row.fund_name),
    neutralizeFormula(row.account_name ?? ""),
    row.amount,
    neutralizeFormula(row.description ?? ""),
    neutralizeFormula(row.counterpart_fund_name ?? ""),
    row.id
  ];
}

interface FundTotals {
  topUp: bigint;
  expense: bigint;
  transfer: bigint;
}

// Totals appended below the detail rows: overall per type, then per fund (balance = sum of all its amounts).
function buildSummaryRecords(rows: TransactionSheetRow[]): string[][] {
  const overall: FundTotals = { topUp: 0n, expense: 0n, transfer: 0n };
  const byFund = new Map<string, FundTotals>();

  for (const row of rows) {
    const cents = toCents(row.amount);
    let fund = byFund.get(row.fund_name);
    if (!fund) {
      fund = { topUp: 0n, expense: 0n, transfer: 0n };
      byFund.set(row.fund_name, fund);
    }
    const key = row.type === "TOP_UP" ? "topUp" : row.type === "EXPENSE" ? "expense" : "transfer";
    overall[key] += cents;
    fund[key] += cents;
  }

  return [
    ["總計"],
    ["項目", "金額"],
    ["儲值合計", formatCents(overall.topUp)],
    ["支出合計", formatCents(overall.expense)],
    ["淨額", formatCents(overall.topUp + overall.expense + overall.transfer)],
    [],
    ["各基金小計"],
    ["基金", "儲值", "支出", "轉帳淨額", "餘額"],
    ...[...byFund].map(([name, t]) => [
      neutralizeFormula(name),
      formatCents(t.topUp),
      formatCents(t.expense),
      formatCents(t.transfer),
      formatCents(t.topUp + t.expense + t.transfer)
    ])
  ];
}

// Amounts arrive as numeric(14,2) strings; sum them as integer cents to avoid floating-point drift.
function toCents(amount: string): bigint {
  const negative = amount.startsWith("-");
  const [whole = "0", fraction = ""] = amount.replace(/^[-+]/, "").split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));
  return negative ? -cents : cents;
}

function formatCents(cents: bigint): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  return `${negative ? "-" : ""}${abs / 100n}.${(abs % 100n).toString().padStart(2, "0")}`;
}

// Free-text cells starting with =, +, -, @ would be run as formulas by spreadsheet apps.
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
