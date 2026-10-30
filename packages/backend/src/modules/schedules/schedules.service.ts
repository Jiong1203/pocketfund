import { AppError, notFound } from "../../common/errors";
import type { AccountsRepository } from "../accounts/accounts.repository";
import type { FundsRepository } from "../funds/funds.repository";
import type { TransactionsService } from "../transactions/transactions.service";
import { TransactionType } from "../transactions/transactions.types";
import type { SchedulesRepository } from "./schedules.repository";
import type { CreateScheduledTopUpDto, UpdateScheduledTopUpDto } from "./schedules.schemas";

export interface ScheduledTopUpRunSummary {
  runDate: string;
  executed: number;
  skipped: number;
  failed: number;
}

export class SchedulesService {
  public constructor(
    private readonly schedulesRepository: SchedulesRepository,
    private readonly fundsRepository: FundsRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsService: TransactionsService
  ) {}

  public async create(userId: string, dto: CreateScheduledTopUpDto) {
    await this.fundsRepository.ensureFundExists(userId, dto.fundId);
    await this.accountsRepository.ensureOwned(userId, dto.accountId);

    return this.schedulesRepository.createSchedule(
      userId,
      dto.fundId,
      dto.accountId,
      dto.amount,
      dto.cycleDay,
      dto.description
    );
  }

  public async list(userId: string) {
    return this.schedulesRepository.listSchedules(userId);
  }

  public async update(userId: string, scheduleId: string, dto: UpdateScheduledTopUpDto) {
    if (dto.accountId) {
      await this.accountsRepository.ensureOwned(userId, dto.accountId);
    }

    const updated = await this.schedulesRepository.updateSchedule(userId, scheduleId, {
      accountId: dto.accountId,
      amount: dto.amount,
      cycleDay: dto.cycleDay,
      description: dto.description,
      isActive: dto.isActive
    });

    if (!updated) {
      throw notFound("Schedule not found.");
    }
    return updated;
  }

  public async delete(userId: string, scheduleId: string) {
    const deleted = await this.schedulesRepository.deleteSchedule(userId, scheduleId);
    if (!deleted) {
      throw notFound("Schedule not found.");
    }
    return { deleted: true };
  }

  // Posts every active schedule due on `now`'s (UTC) day of month. Safe to re-run on the same day:
  // each schedule is recorded in scheduled_topup_runs and the transaction uses a deterministic idempotency key.
  public async executeScheduledTopUps(now: Date): Promise<ScheduledTopUpRunSummary> {
    const cycleDay = now.getUTCDate();
    const runDate = now.toISOString().slice(0, 10);
    const lastDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    const schedules = await this.schedulesRepository.getActiveSchedulesByDay(cycleDay, cycleDay === lastDayOfMonth);
    const summary: ScheduledTopUpRunSummary = { runDate, executed: 0, skipped: 0, failed: 0 };

    for (const schedule of schedules) {
      if (await this.schedulesRepository.hasRunOnDate(schedule.id, runDate)) {
        summary.skipped++;
        continue;
      }

      try {
        await this.transactionsService.createLedgerTransaction({
          userId: schedule.user_id,
          fundId: schedule.fund_id,
          accountId: schedule.account_id,
          type: TransactionType.TOP_UP,
          amountAbs: Number(schedule.amount),
          description: schedule.description ?? "每月自動儲值",
          idempotencyKey: `scheduled-topup:${schedule.id}:${runDate}`
        });
      } catch (error) {
        // Already posted by an earlier run that failed before markRun: just record the run.
        if (!(error instanceof AppError && error.code === "LEDGER_DUPLICATE_TRANSACTION")) {
          summary.failed++;
          console.error(
            JSON.stringify({
              level: "error",
              event: "scheduled_topup_failed",
              schedule_id: schedule.id,
              run_date: runDate,
              error: error instanceof Error ? error.message : String(error)
            })
          );
          continue;
        }
      }

      await this.schedulesRepository.markRun(schedule.id, runDate);
      summary.executed++;
      console.log(
        JSON.stringify({ level: "info", event: "scheduled_topup_executed", schedule_id: schedule.id, run_date: runDate })
      );
    }

    return summary;
  }
}
