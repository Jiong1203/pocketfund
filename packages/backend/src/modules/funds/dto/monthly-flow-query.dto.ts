import { IsDateString, IsOptional } from "class-validator";

export class MonthlyFlowQueryDto {
  @IsOptional()
  @IsDateString()
  public startAt?: string;

  @IsOptional()
  @IsDateString()
  public endAt?: string;
}
