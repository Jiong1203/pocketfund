import { getAccessToken } from "./session";

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

async function request<T>(path: string, init: RequestInit = {}, requiresAuth = true): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(path, { ...init, headers });
  const json = (await response.json().catch(() => ({}))) as { data?: T } & ApiErrorShape;

  if (!response.ok) {
    throw new ApiError(
      json.error?.message ?? `HTTP ${response.status}`,
      json.error?.code ?? "HTTP_ERROR",
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
