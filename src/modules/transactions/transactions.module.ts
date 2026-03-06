import { Module } from "@nestjs/common";
import { TransactionsRepository } from "./transactions.repository";
import { TransactionsService } from "./transactions.service";

@Module({
  providers: [TransactionsRepository, TransactionsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}
