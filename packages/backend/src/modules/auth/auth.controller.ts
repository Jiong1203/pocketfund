import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { Public } from "./public.decorator";

@Public()
@Controller("auth")
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post("register")
  public async register(@Body() dto: RegisterDto) {
    return { data: await this.authService.register(dto) };
  }

  @Post("login")
  public async login(@Body() dto: LoginDto) {
    return { data: await this.authService.login(dto) };
  }
}
