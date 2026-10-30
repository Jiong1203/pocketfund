import type { AuthUser } from "./modules/auth/auth.types";
import type { Services } from "./container";

export interface AppEnv {
  Bindings: Env;
  Variables: {
    requestId: string;
    user: AuthUser;
    services: Services;
  };
}
