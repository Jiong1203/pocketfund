import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { IsUUID } from "class-validator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateFundTransactionDto } from "../transactions/dto/create-fund-transaction.dto";
import { CreateFundDto } from "./dto/create-fund.dto";
import { UpdateFundDto } from "./dto/update-fund.dto";
import { FundsService } from "./funds.service";

class FundParamDto {
  @IsUUID()
  public id!: string;
}

@Controller("funds")
export class FundsController {
  public constructor(private readonly fundsService: FundsService) {}

  @Post()
  public async create(@CurrentUser() user: AuthUser, @Body() dto: CreateFundDto) {
    return { data: await this.fundsService.create(user.id, dto) };
  }

  @Get()
  public async list(@CurrentUser() user: AuthUser) {
    return { data: await this.fundsService.list(user.id) };
  }

  @Get(":id")
  public async getById(@CurrentUser() user: AuthUser, @Param() params: FundParamDto) {
    return { data: await this.fundsService.getById(user.id, params.id) };
  }

  @Patch(":id")
  public async update(
    @CurrentUser() user: AuthUser,
    @Param() params: FundParamDto,
    @Body() dto: UpdateFundDto
  ) {
    return { data: await this.fundsService.update(user.id, params.id, dto) };
  }

  @Delete(":id")
  public async delete(@CurrentUser() user: AuthUser, @Param() params: FundParamDto) {
    return { data: await this.fundsService.delete(user.id, params.id) };
  }

  @Post(":id/top-ups")
  public async topUp(
    @CurrentUser() user: AuthUser,
    @Param() params: FundParamDto,
    @Body() dto: CreateFundTransactionDto
  ) {
    return { data: await this.fundsService.topUp(user.id, params.id, dto) };
  }

  @Post(":id/expenses")
  public async expense(
    @CurrentUser() user: AuthUser,
    @Param() params: FundParamDto,
    @Body() dto: CreateFundTransactionDto
  ) {
    return { data: await this.fundsService.expense(user.id, params.id, dto) };
  }

  @Post(":id/adjustments")
  public async adjust(
    @CurrentUser() user: AuthUser,
    @Param() params: FundParamDto,
    @Body() dto: CreateFundTransactionDto
  ) {
    return { data: await this.fundsService.adjust(user.id, params.id, dto) };
  }

  @Get(":id/balance")
  public async getBalance(@CurrentUser() user: AuthUser, @Param() params: FundParamDto) {
    return { data: await this.fundsService.getBalance(user.id, params.id) };
  }

  @Get(":id/transactions")
  public async getTransactions(
    @CurrentUser() user: AuthUser,
    @Param() params: FundParamDto,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number
  ) {
    return { data: await this.fundsService.getTransactions(user.id, params.id, limit) };
  }
}
