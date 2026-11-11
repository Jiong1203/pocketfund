export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
}
