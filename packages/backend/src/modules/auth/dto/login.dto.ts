import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  public email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  public password!: string;
}
