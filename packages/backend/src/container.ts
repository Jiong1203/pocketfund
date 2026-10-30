import { DatabaseService } from "./common/database";
import { AppError } from "./common/errors";
import { AccountsRepository } from "./modules/accounts/accounts.repository";
import { AccountsService } from "./modules/accounts/accounts.service";
import { AuthRepository } from "./modules/auth/auth.repository";
import { AuthService } from "./modules/auth/auth.service";
import { FundsRepository } from "./modules/funds/funds.repository";
import { FundsService } from "./modules/funds/funds.service";
import { SchedulesRepository } from "./modules/schedules/schedules.repository";
import { SchedulesService } from "./modules/schedules/schedules.service";
import { TransactionsRepository } from "./modules/transactions/transactions.repository";
import { TransactionsService } from "./modules/transactions/transactions.service";

// Wires repositories and services for a single request or cron run.
export function createServices(db: DatabaseService, jwtSecret: string) {
  const accountsRepository = new AccountsRepository(db);
  const fundsRepository = new FundsRepository(db);
  const transactionsRepository = new TransactionsRepository(db);
  const transactionsService = new TransactionsService(transactionsRepository);

  return {
    auth: new AuthService(new AuthRepository(db), jwtSecret),
    accounts: new AccountsService(accountsRepository, transactionsRepository),
    funds: new FundsService(fundsRepository, accountsRepository, transactionsRepository, transactionsService),
    transactions: transactionsService,
    schedules: new SchedulesService(new SchedulesRepository(db), fundsRepository, accountsRepository, transactionsService)
  };
}

export type Services = ReturnType<typeof createServices>;

export interface ServiceScope {
  services: Services;
  close(): Promise<void>;
}

export function openServiceScope(env: Env): ServiceScope {
  if (!env.JWT_SECRET) {
    throw new AppError({ code: "SYSTEM_MISCONFIGURED", message: "JWT_SECRET is not configured." }, 500);
  }
  const db = new DatabaseService(env.HYPERDRIVE.connectionString);
  return { services: createServices(db, env.JWT_SECRET), close: () => db.close() };
}
