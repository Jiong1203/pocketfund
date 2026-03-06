import { Injectable } from "@nestjs/common";
import { AccountsRepository } from "./accounts.repository";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";

@Injectable()
export class AccountsService {
  public constructor(private readonly accountsRepository: AccountsRepository) {}

  public async create(userId: string, dto: CreateAccountDto) {
    return this.accountsRepository.create(userId, dto);
  }

  public async list(userId: string) {
    return this.accountsRepository.list(userId);
  }

  public async getById(userId: string, accountId: string) {
    return this.accountsRepository.getById(userId, accountId);
  }

  public async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    return this.accountsRepository.update(userId, accountId, dto);
  }

  public async delete(userId: string, accountId: string) {
    await this.accountsRepository.delete(userId, accountId);
    return { deleted: true };
  }
}
