import { HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { AppException } from "../../common/errors/app-exception";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthRepository } from "./auth.repository";
import { AuthUser } from "./auth.types";

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  public constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService
  ) {}

  public async register(dto: RegisterDto): Promise<{ accessToken: string; user: AuthUser }> {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppException(
        {
          code: "AUTH_EMAIL_ALREADY_EXISTS",
          message: "Email is already registered."
        },
        HttpStatus.CONFLICT
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.authRepository.createUser(dto.email, passwordHash);
    return this.buildAuthResponse({ id: user.id, email: user.email });
  }

  public async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthUser }> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const isValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    return this.buildAuthResponse({ id: user.id, email: user.email });
  }

  public async verifyAccessToken(token: string): Promise<AuthUser> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    return { id: payload.sub, email: payload.email };
  }

  private async buildAuthResponse(user: AuthUser): Promise<{ accessToken: string; user: AuthUser }> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email
    });
    return { accessToken, user };
  }
}
