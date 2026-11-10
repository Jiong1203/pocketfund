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

// "Remember me" keeps only the email address on this device, never the password.
const REMEMBERED_EMAIL_KEY = "pocketfund_remembered_email";

export function getRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setRememberedEmail(email: string | null): void {
  try {
    if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Storage can be unavailable (e.g. private mode); remembering the email is only a convenience.
  }
}
