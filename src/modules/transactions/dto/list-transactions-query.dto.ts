import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { TransactionType } from "../transaction-type.enum";

export class ListTransactionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  public pageSize?: number;

  @IsOptional()
  @IsEnum(TransactionType)
  public type?: TransactionType;

  @IsOptional()
  @IsDateString()
  public startAt?: string;

  @IsOptional()
  @IsDateString()
  public endAt?: string;
}
