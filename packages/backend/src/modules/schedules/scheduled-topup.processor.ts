import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { TransactionType } from "../transactions/transaction-type.enum";
import { TransactionsService } from "../transactions/transactions.service";
import { SchedulesRepository } from "./schedules.repository";

@Injectable()
export class ScheduledTopUpProcessor {
  private readonly logger = new Logger(ScheduledTopUpProcessor.name);

  public constructor(
    private readonly schedulesRepository: SchedulesRepository,
    private readonly transactionsService: TransactionsService
  ) {}

  @Cron("0 5 0 * * *")
  public async runDailyTopUps(): Promise<void> {
    const now = new Date();
    const cycleDay = now.getDate();
    const runDate = now.toISOString().slice(0, 10);
    const schedules = await this.schedulesRepository.getActiveSchedulesByDay(cycleDay);

    for (const schedule of schedules) {
      const alreadyRun = await this.schedulesRepository.hasRunOnDate(schedule.id, runDate);
      if (alreadyRun) {
        continue;
      }

      await this.transactionsService.createLedgerTransaction({
        userId: schedule.user_id,
        fundId: schedule.fund_id,
        accountId: schedule.account_id,
        type: TransactionType.TOP_UP,
        amountAbs: Number(schedule.amount),
        description: schedule.description ?? "Scheduled top-up",
        idempotencyKey: `scheduled-topup:${schedule.id}:${runDate}`
      });

      await this.schedulesRepository.markRun(schedule.id, runDate);
      this.logger.log(`Scheduled top-up executed: scheduleId=${schedule.id} runDate=${runDate}`);
    }
  }
}
