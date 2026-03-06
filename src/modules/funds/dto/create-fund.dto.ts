import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, Max, IsNumber } from "class-validator";

export class CreateFundDto {
  @IsString()
  @MaxLength(80)
  public name!: string;

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
