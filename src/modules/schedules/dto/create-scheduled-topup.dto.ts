import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class CreateScheduledTopUpDto {
  @IsUUID()
  public fundId!: string;

  @IsUUID()
  public accountId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  public amount!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  public cycleDay!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public description?: string;
}
