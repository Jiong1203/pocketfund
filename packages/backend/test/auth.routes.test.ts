import { beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("Auth routes", () => {
  let harness: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    harness = createTestApp();
  });

  it("POST /auth/register returns the wrapped auth payload without requiring a token", async () => {
    harness.services.auth.register.mockResolvedValue({ accessToken: "mock-token", user: { id: "u1", email: "a@b.com" } });

    const res = await harness.call("POST", "/auth/register", {
      body: { email: "a@b.com", password: "secret123" },
      token: null
    });

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBe("mock-token");
    expect(harness.services.auth.register).toHaveBeenCalledWith({ email: "a@b.com", password: "secret123" });
  });

  it("POST /auth/login returns the wrapped auth payload", async () => {
    harness.services.auth.login.mockResolvedValue({ accessToken: "mock-token", user: { id: "u1", email: "a@b.com" } });

    const res = await harness.call("POST", "/auth/login", {
      body: { email: "a@b.com", password: "secret123" },
      token: null
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.id).toBe("u1");
  });

  it("rejects an invalid email or short password", async () => {
    const badEmail = await harness.call("POST", "/auth/login", { body: { email: "nope", password: "secret123" }, token: null });
    const shortPassword = await harness.call("POST", "/auth/login", { body: { email: "a@b.com", password: "123" }, token: null });

    expect(badEmail.status).toBe(400);
    expect(shortPassword.status).toBe(400);
    expect(harness.services.auth.login).not.toHaveBeenCalled();
  });
});
