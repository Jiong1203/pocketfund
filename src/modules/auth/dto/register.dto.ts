import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  public email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  public password!: string;
}
