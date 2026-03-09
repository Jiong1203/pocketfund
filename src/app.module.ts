import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { DatabaseModule } from "./common/database/database.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./modules/auth/jwt-auth.guard";
import { FundsModule } from "./modules/funds/funds.module";
import { SchedulesModule } from "./modules/schedules/schedules.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    FundsModule,
    SchedulesModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ]
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, RequestLoggerMiddleware).forRoutes("*");
  }
}
