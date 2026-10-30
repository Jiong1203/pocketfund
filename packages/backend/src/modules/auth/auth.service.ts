import { sign, verify } from "hono/jwt";
import { AppError, unauthorized } from "../../common/errors";
import { hashPassword, verifyPassword } from "../../common/password";
import type { AuthRepository } from "./auth.repository";
import type { CredentialsDto } from "./auth.schemas";
import type { AuthResult, AuthUser } from "./auth.types";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const JWT_ALGORITHM = "HS256";

export class AuthService {
  public constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtSecret: string
  ) {}

  public async register(dto: CredentialsDto): Promise<AuthResult> {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppError({ code: "AUTH_EMAIL_ALREADY_EXISTS", message: "Email is already registered." }, 409);
    }

    const user = await this.authRepository.createUser(dto.email, await hashPassword(dto.password));
    return this.buildAuthResponse({ id: user.id, email: user.email });
  }

  public async login(dto: CredentialsDto): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw unauthorized("Invalid credentials.");
    }

    const check = await verifyPassword(dto.password, user.password_hash);
    if (!check.valid) {
      throw unauthorized("Invalid credentials.");
    }
    if (check.needsRehash) {
      await this.authRepository.updatePasswordHash(user.id, await hashPassword(dto.password));
    }

    return this.buildAuthResponse({ id: user.id, email: user.email });
  }

  public async verifyAccessToken(token: string): Promise<AuthUser> {
    try {
      const payload = await verify(token, this.jwtSecret, JWT_ALGORITHM);
      if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
        throw new Error("Malformed token payload.");
      }
      return { id: payload.sub, email: payload.email };
    } catch {
      throw unauthorized("Invalid or expired token.");
    }
  }

  private async buildAuthResponse(user: AuthUser): Promise<AuthResult> {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = await sign(
      { sub: user.id, email: user.email, iat: now, exp: now + TOKEN_TTL_SECONDS },
      this.jwtSecret,
      JWT_ALGORITHM
    );
    return { accessToken, user };
  }
}
