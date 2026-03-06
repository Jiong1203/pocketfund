import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { IsUUID } from "class-validator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { AccountsService } from "./accounts.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";

class AccountParamDto {
  @IsUUID()
  public id!: string;
}

@Controller("accounts")
export class AccountsController {
  public constructor(private readonly accountsService: AccountsService) {}

  @Post()
  public async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAccountDto) {
    return { data: await this.accountsService.create(user.id, dto) };
  }

  @Get()
  public async list(@CurrentUser() user: AuthUser) {
    return { data: await this.accountsService.list(user.id) };
  }

  @Get(":id")
  public async getById(@CurrentUser() user: AuthUser, @Param() params: AccountParamDto) {
    return { data: await this.accountsService.getById(user.id, params.id) };
  }

  @Patch(":id")
  public async update(
    @CurrentUser() user: AuthUser,
    @Param() params: AccountParamDto,
    @Body() dto: UpdateAccountDto
  ) {
    return { data: await this.accountsService.update(user.id, params.id, dto) };
  }

  @Delete(":id")
  public async delete(@CurrentUser() user: AuthUser, @Param() params: AccountParamDto) {
    return { data: await this.accountsService.delete(user.id, params.id) };
  }
}
