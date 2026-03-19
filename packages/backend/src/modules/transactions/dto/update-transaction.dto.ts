import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { TransactionType } from "../transaction-type.enum";

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(TransactionType)
  public type?: TransactionType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  public amount?: number;

  @IsOptional()
  @IsString()
  public description?: string;

  @IsOptional()
  @IsDateString()
  public occurredAt?: string;
}
