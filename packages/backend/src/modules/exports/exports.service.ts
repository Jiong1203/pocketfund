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
    const lines = [CSV_HEADER, ...rows.map(toCsvRecord)].map((fields) => fields.map(escapeCsvField).join(","));
    return UTF8_BOM + lines.join("\r\n") + "\r\n";
  }
}

function toCsvRecord(row: TransactionSheetRow): string[] {
  return [
    row.occurred_on,
    TYPE_LABELS[row.type] ?? row.type,
    neutralizeFormula(row.fund_name),
    neutralizeFormula(row.account_name),
    row.amount,
    neutralizeFormula(row.description ?? ""),
    neutralizeFormula(row.counterpart_fund_name ?? ""),
    row.id
  ];
}

// Free-text cells starting with =, +, -, @ would be run as formulas by spreadsheet apps.
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
