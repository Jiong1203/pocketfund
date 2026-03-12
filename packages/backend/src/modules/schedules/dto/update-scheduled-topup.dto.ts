import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class UpdateScheduledTopUpDto {
  @IsOptional()
  @IsUUID()
  public accountId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  public amount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  public cycleDay?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public description?: string;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}
