import { IsIn, IsString, MaxLength } from "class-validator";

export class CreateAccountDto {
  @IsString()
  @MaxLength(80)
  public name!: string;

  @IsString()
  @IsIn(["salary", "saving"])
  public type!: "salary" | "saving";
}
