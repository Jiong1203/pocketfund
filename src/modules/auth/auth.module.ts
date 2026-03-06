import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev_jwt_secret_change_me",
      signOptions: {
        expiresIn: "7d"
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService],
  exports: [AuthService]
})
export class AuthModule {}
