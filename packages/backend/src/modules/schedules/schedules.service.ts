import { Injectable, NotFoundException } from "@nestjs/common";
import { AccountsRepository } from "../accounts/accounts.repository";
import { FundsRepository } from "../funds/funds.repository";
import { CreateScheduledTopUpDto } from "./dto/create-scheduled-topup.dto";
import { UpdateScheduledTopUpDto } from "./dto/update-scheduled-topup.dto";
import { SchedulesRepository } from "./schedules.repository";

@Injectable()
export class SchedulesService {
  public constructor(
    private readonly schedulesRepository: SchedulesRepository,
    private readonly fundsRepository: FundsRepository,
    private readonly accountsRepository: AccountsRepository
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
      throw new NotFoundException("Schedule not found.");
    }
    return updated;
  }

  public async delete(userId: string, scheduleId: string) {
    const deleted = await this.schedulesRepository.deleteSchedule(userId, scheduleId);
    if (!deleted) {
      throw new NotFoundException("Schedule not found.");
    }
    return { deleted: true };
  }
}
