import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public name?: string;

  @IsOptional()
  @IsString()
  @IsIn(["salary", "saving"])
  public type?: "salary" | "saving";
}
