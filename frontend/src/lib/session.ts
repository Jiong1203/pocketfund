const TOKEN_KEY = "pocketfund_token";

export function getAccessToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken().length > 0;
}
