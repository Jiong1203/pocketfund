import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateFundTransactionDto {
  @IsUUID()
  public accountId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  public amount!: number;

  @IsOptional()
  @IsString()
  public description?: string;

  @IsOptional()
  @IsDateString()
  public occurredAt?: string;

  @IsOptional()
  @IsString()
  public idempotencyKey?: string;
}
