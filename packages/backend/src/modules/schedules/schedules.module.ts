import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { FundsModule } from "../funds/funds.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { SchedulesController } from "./schedules.controller";
import { ScheduledTopUpProcessor } from "./scheduled-topup.processor";
import { SchedulesRepository } from "./schedules.repository";
import { SchedulesService } from "./schedules.service";

@Module({
  imports: [TransactionsModule, FundsModule, AccountsModule],
  controllers: [SchedulesController],
  providers: [SchedulesRepository, ScheduledTopUpProcessor, SchedulesService]
})
export class SchedulesModule {}
