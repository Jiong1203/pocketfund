import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch } from "@nestjs/common";
import { IsUUID } from "class-validator";
import { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsService } from "./transactions.service";

class TransactionParamDto {
  @IsUUID()
  public id!: string;
}

@Controller("transactions")
export class TransactionsController {
  public constructor(private readonly transactionsService: TransactionsService) {}

  @Patch(":id")
  public async update(
    @CurrentUser() user: AuthUser,
    @Param() params: TransactionParamDto,
    @Body() dto: UpdateTransactionDto
  ) {
    return {
      data: await this.transactionsService.updateTransaction(user.id, params.id, {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        occurredAt: dto.occurredAt
      })
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @CurrentUser() user: AuthUser,
    @Param() params: TransactionParamDto
  ): Promise<void> {
    await this.transactionsService.deleteTransaction(user.id, params.id);
  }
}
