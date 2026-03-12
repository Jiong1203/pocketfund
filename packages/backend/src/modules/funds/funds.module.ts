import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { FundsController } from "./funds.controller";
import { FundsRepository } from "./funds.repository";
import { FundsService } from "./funds.service";

@Module({
  imports: [TransactionsModule, AccountsModule],
  controllers: [FundsController],
  providers: [FundsRepository, FundsService],
  exports: [FundsService, FundsRepository]
})
export class FundsModule {}
