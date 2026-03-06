import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateFundDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  public monthlyAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  public cycleDay?: number;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;
}
