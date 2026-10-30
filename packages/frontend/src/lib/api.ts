import router from "../router";
import { clearAccessToken, getAccessToken } from "./session";

export interface ApiErrorShape {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly details: unknown;

  public constructor(message: string, code = "HTTP_ERROR", details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// The API answers in English; show users a zh-tw message keyed by error code.
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_UNAUTHORIZED: "登入已過期，請重新登入。",
  AUTH_EMAIL_ALREADY_EXISTS: "這個電子郵件已經註冊過了。",
  VALIDATION_ERROR: "輸入的資料格式不正確，請檢查後再試一次。",
  VALIDATION_NO_FIELDS: "沒有需要更新的欄位。",
  LEDGER_DUPLICATE_TRANSACTION: "這筆交易已經送出過了。",
  LEDGER_NOT_FOUND: "找不到這筆交易，可能已被刪除。",
  LEDGER_ACCOUNT_IN_USE: "這個帳戶已有交易或排程紀錄，無法刪除。",
  LEDGER_FUND_IN_USE: "這個基金已有交易或排程紀錄，無法刪除。",
  RESOURCE_NOT_FOUND: "找不到資料，可能已被刪除。"
};

const INVALID_CREDENTIALS_MESSAGE = "電子郵件或密碼錯誤。";
const FALLBACK_MESSAGE = "系統發生錯誤，請稍後再試。";
const NETWORK_MESSAGE = "無法連線到伺服器，請確認網路後再試一次。";

function toUserMessage(code: string | undefined, message: string | undefined, requiresAuth: boolean): string {
  // Login/register return 401 for wrong credentials, which is not an expired session.
  if (code === "AUTH_UNAUTHORIZED" && !requiresAuth) return INVALID_CREDENTIALS_MESSAGE;
  return (code && ERROR_MESSAGES[code]) ?? message ?? FALLBACK_MESSAGE;
}

async function request<T>(path: string, init: RequestInit = {}, requiresAuth = true): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError(NETWORK_MESSAGE, "NETWORK_ERROR");
  }
  const json = (await response.json().catch(() => ({}))) as { data?: T } & ApiErrorShape;

  if (!response.ok) {
    const code = json.error?.code ?? "HTTP_ERROR";
    if (response.status === 401 && requiresAuth) {
      clearAccessToken();
      await router.push({ name: "login" });
    }
    throw new ApiError(
      response.status >= 500 ? FALLBACK_MESSAGE : toUserMessage(code, json.error?.message, requiresAuth),
      code,
      json.error?.details
    );
  }

  return json.data as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },
  post<T>(path: string, body: unknown, requiresAuth = true): Promise<T> {
    return request<T>(
      path,
      {
        method: "POST",
        body: JSON.stringify(body)
      },
      requiresAuth
    );
  },
  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  }
};
