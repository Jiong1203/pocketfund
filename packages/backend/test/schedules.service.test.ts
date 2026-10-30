import { describe, expect, it, vi } from "vitest";
import { AppError } from "../src/common/errors";
import type { AccountsRepository } from "../src/modules/accounts/accounts.repository";
import type { FundsRepository } from "../src/modules/funds/funds.repository";
import type { SchedulesRepository, ScheduledTopUpRow } from "../src/modules/schedules/schedules.repository";
import { SchedulesService } from "../src/modules/schedules/schedules.service";
import type { TransactionsService } from "../src/modules/transactions/transactions.service";

const schedule = (id: string): ScheduledTopUpRow => ({
  id,
  user_id: "user-1",
  fund_id: "fund-1",
  account_id: "acc-1",
  amount: "1200.00",
  cycle_day: 5,
  description: null,
  is_active: true
});

function setup(rows: ScheduledTopUpRow[]) {
  const schedulesRepository = {
    getActiveSchedulesByDay: vi.fn(async () => rows),
    hasRunOnDate: vi.fn(async () => false),
    markRun: vi.fn()
  };
  const transactionsService = { createLedgerTransaction: vi.fn() };
  const service = new SchedulesService(
    schedulesRepository as unknown as SchedulesRepository,
    {} as FundsRepository,
    {} as AccountsRepository,
    transactionsService as unknown as TransactionsService
  );
  return { schedulesRepository, transactionsService, service };
}

describe("SchedulesService.executeScheduledTopUps", () => {
  const now = new Date("2026-11-05T00:05:00Z");

  it("posts due schedules with a deterministic idempotency key and records the run", async () => {
    const { service, schedulesRepository, transactionsService } = setup([schedule("s1")]);

    const summary = await service.executeScheduledTopUps(now);

    expect(schedulesRepository.getActiveSchedulesByDay).toHaveBeenCalledWith(5, false);
    expect(transactionsService.createLedgerTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amountAbs: 1200, idempotencyKey: "scheduled-topup:s1:2026-11-05", type: "TOP_UP" })
    );
    expect(schedulesRepository.markRun).toHaveBeenCalledWith("s1", "2026-11-05");
    expect(summary).toEqual({ runDate: "2026-11-05", executed: 1, skipped: 0, failed: 0 });
  });

  it("also picks up later cycle days on the last day of a short month", async () => {
    const { service, schedulesRepository } = setup([]);

    await service.executeScheduledTopUps(new Date("2026-02-28T00:05:00Z"));
    await service.executeScheduledTopUps(new Date("2026-11-30T00:05:00Z"));
    await service.executeScheduledTopUps(new Date("2026-12-30T00:05:00Z"));

    expect(schedulesRepository.getActiveSchedulesByDay.mock.calls).toEqual([
      [28, true],
      [30, true],
      [30, false]
    ]);
  });

  it("skips schedules that already ran today", async () => {
    const { service, schedulesRepository, transactionsService } = setup([schedule("s1")]);
    schedulesRepository.hasRunOnDate.mockResolvedValue(true);

    const summary = await service.executeScheduledTopUps(now);

    expect(transactionsService.createLedgerTransaction).not.toHaveBeenCalled();
    expect(summary.skipped).toBe(1);
  });

  it("treats an already-posted transaction as executed and keeps going after a failure", async () => {
    const { service, schedulesRepository, transactionsService } = setup([schedule("dup"), schedule("bad"), schedule("ok")]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    transactionsService.createLedgerTransaction
      .mockRejectedValueOnce(new AppError({ code: "LEDGER_DUPLICATE_TRANSACTION", message: "dup" }, 409))
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValueOnce({ id: "tx" });

    const summary = await service.executeScheduledTopUps(now);

    expect(schedulesRepository.markRun.mock.calls.map(([id]) => id)).toEqual(["dup", "ok"]);
    expect(summary).toEqual({ runDate: "2026-11-05", executed: 2, skipped: 0, failed: 1 });
  });
});
