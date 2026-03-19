import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { IsUUID } from "class-validator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateFundTransactionDto } from "../transactions/dto/create-fund-transaction.dto";
import { ListTransactionsQueryDto } from "../transactions/dto/list-transactions-query.dto";
import { CreateFundDto } from "./dto/create-fund.dto";
import { MonthlyFlowQueryDto } from "./dto/monthly-flow-query.dto";
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

  @Get(":id/balance")
  public async getBalance(@CurrentUser() user: AuthUser, @Param() params: FundParamDto) {
    return { data: await this.fundsService.getBalance(user.id, params.id) };
  }

  @Get(":id/transactions")
  public async getTransactions(
    @CurrentUser() user: AuthUser,
    @Param() params: FundParamDto,
    @Query() query: ListTransactionsQueryDto
  ) {
    return { data: await this.fundsService.getTransactions(user.id, params.id, query) };
  }

  @Get(":id/monthly-flow")
  public async getMonthlyFlow(
    @CurrentUser() user: AuthUser,
    @Param() params: FundParamDto,
    @Query() query: MonthlyFlowQueryDto
  ) {
    return { data: await this.fundsService.getMonthlyFlow(user.id, params.id, query) };
  }
}
