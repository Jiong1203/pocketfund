import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthUser } from "./auth.types";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  if (!request.user) {
    throw new UnauthorizedException("Missing authenticated user.");
  }
  return request.user;
});
