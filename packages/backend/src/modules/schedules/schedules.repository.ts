import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";

export interface ScheduledTopUpRow {
  id: string;
  user_id: string;
  fund_id: string;
  account_id: string;
  amount: string;
  cycle_day: number;
  description: string | null;
  is_active: boolean;
}

@Injectable()
export class SchedulesRepository {
  public constructor(private readonly db: DatabaseService) {}

  public async getActiveSchedulesByDay(cycleDay: number): Promise<ScheduledTopUpRow[]> {
    const result = await this.db.query<ScheduledTopUpRow>(
      `
      select id, user_id, fund_id, account_id, amount, cycle_day, description, is_active
      from scheduled_topups
      where is_active = true and cycle_day = $1
      `,
      [cycleDay]
    );

    return result.rows;
  }

  public async createSchedule(
    userId: string,
    fundId: string,
    accountId: string,
    amount: number,
    cycleDay: number,
    description?: string
  ): Promise<ScheduledTopUpRow> {
    const result = await this.db.query<ScheduledTopUpRow>(
      `
      insert into scheduled_topups (user_id, fund_id, account_id, amount, cycle_day, description, is_active)
      values ($1, $2, $3, $4, $5, $6, true)
      returning id, user_id, fund_id, account_id, amount, cycle_day, description, is_active
      `,
      [userId, fundId, accountId, amount, cycleDay, description ?? null]
    );
    return result.rows[0];
  }

  public async listSchedules(userId: string): Promise<ScheduledTopUpRow[]> {
    const result = await this.db.query<ScheduledTopUpRow>(
      `
      select id, user_id, fund_id, account_id, amount, cycle_day, description, is_active
      from scheduled_topups
      where user_id = $1
      order by created_at desc
      `,
      [userId]
    );
    return result.rows;
  }

  public async getScheduleById(userId: string, scheduleId: string): Promise<ScheduledTopUpRow | null> {
    const result = await this.db.query<ScheduledTopUpRow>(
      `
      select id, user_id, fund_id, account_id, amount, cycle_day, description, is_active
      from scheduled_topups
      where user_id = $1 and id = $2
      limit 1
      `,
      [userId, scheduleId]
    );
    return result.rows[0] ?? null;
  }

  public async updateSchedule(
    userId: string,
    scheduleId: string,
    patch: Partial<{
      accountId: string;
      amount: number;
      cycleDay: number;
      description: string | null;
      isActive: boolean;
    }>
  ): Promise<ScheduledTopUpRow | null> {
    const current = await this.getScheduleById(userId, scheduleId);
    if (!current) {
      return null;
    }

    const result = await this.db.query<ScheduledTopUpRow>(
      `
      update scheduled_topups
      set account_id = $3,
          amount = $4,
          cycle_day = $5,
          description = $6,
          is_active = $7,
          updated_at = now()
      where user_id = $1 and id = $2
      returning id, user_id, fund_id, account_id, amount, cycle_day, description, is_active
      `,
      [
        userId,
        scheduleId,
        patch.accountId ?? current.account_id,
        patch.amount ?? Number(current.amount),
        patch.cycleDay ?? current.cycle_day,
        patch.description ?? current.description,
        patch.isActive ?? current.is_active
      ]
    );
    return result.rows[0] ?? null;
  }

  public async deleteSchedule(userId: string, scheduleId: string): Promise<boolean> {
    const result = await this.db.query(
      `
      delete from scheduled_topups
      where user_id = $1 and id = $2
      `,
      [userId, scheduleId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  public async markRun(scheduleId: string, runDate: string): Promise<void> {
    await this.db.query(
      `
      insert into scheduled_topup_runs (schedule_id, run_date)
      values ($1, $2::date)
      on conflict do nothing
      `,
      [scheduleId, runDate]
    );
  }

  public async hasRunOnDate(scheduleId: string, runDate: string): Promise<boolean> {
    const result = await this.db.query<{ found: number }>(
      `
      select 1 as found
      from scheduled_topup_runs
      where schedule_id = $1 and run_date = $2::date
      limit 1
      `,
      [scheduleId, runDate]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
