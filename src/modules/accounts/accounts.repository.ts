import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { AppException } from "../../common/errors/app-exception";
import { DatabaseService } from "../../common/database/database.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";

interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class AccountsRepository {
  public constructor(private readonly db: DatabaseService) {}

  public async create(userId: string, dto: CreateAccountDto): Promise<AccountRow> {
    const result = await this.db.query<AccountRow>(
      `
      insert into accounts (user_id, name, type)
      values ($1, $2, $3)
      returning id, user_id, name, type, created_at, updated_at
      `,
      [userId, dto.name, dto.type]
    );
    return result.rows[0];
  }

  public async list(userId: string): Promise<AccountRow[]> {
    const result = await this.db.query<AccountRow>(
      `
      select id, user_id, name, type, created_at, updated_at
      from accounts
      where user_id = $1
      order by created_at desc
      `,
      [userId]
    );
    return result.rows;
  }

  public async getById(userId: string, accountId: string): Promise<AccountRow> {
    const result = await this.db.query<AccountRow>(
      `
      select id, user_id, name, type, created_at, updated_at
      from accounts
      where user_id = $1 and id = $2
      limit 1
      `,
      [userId, accountId]
    );
    const account = result.rows[0];
    if (!account) {
      throw new NotFoundException("Account not found.");
    }
    return account;
  }

  public async update(userId: string, accountId: string, dto: UpdateAccountDto): Promise<AccountRow> {
    const current = await this.getById(userId, accountId);
    const result = await this.db.query<AccountRow>(
      `
      update accounts
      set name = $3,
          type = $4,
          updated_at = now()
      where user_id = $1 and id = $2
      returning id, user_id, name, type, created_at, updated_at
      `,
      [userId, accountId, dto.name ?? current.name, dto.type ?? current.type]
    );
    return result.rows[0];
  }

  public async delete(userId: string, accountId: string): Promise<void> {
    await this.getById(userId, accountId);

    const transactionUsage = await this.db.query<{ count: string }>(
      "select count(*)::text as count from transactions where user_id = $1 and account_id = $2",
      [userId, accountId]
    );
    const scheduleUsage = await this.db.query<{ count: string }>(
      "select count(*)::text as count from scheduled_topups where user_id = $1 and account_id = $2",
      [userId, accountId]
    );

    if (Number(transactionUsage.rows[0]?.count ?? 0) > 0 || Number(scheduleUsage.rows[0]?.count ?? 0) > 0) {
      throw new AppException(
        {
          code: "LEDGER_ACCOUNT_IN_USE",
          message: "Account cannot be deleted because it is referenced by ledger data."
        },
        HttpStatus.CONFLICT
      );
    }

    await this.db.query("delete from accounts where user_id = $1 and id = $2", [userId, accountId]);
  }

  public async ensureOwned(userId: string, accountId: string): Promise<void> {
    await this.getById(userId, accountId);
  }
}
