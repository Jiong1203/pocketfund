import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword, verifyPassword } from "../src/common/password";
import type { AuthRepository } from "../src/modules/auth/auth.repository";
import { AuthService } from "../src/modules/auth/auth.service";
import { USER, createTestApp } from "./helpers";

describe("Me routes", () => {
  let harness: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    harness = createTestApp();
  });

  it("GET /me returns the signed-in user's profile", async () => {
    const profile = { id: USER.id, email: USER.email, createdAt: "2026-01-01T00:00:00.000Z" };
    harness.services.auth.getProfile.mockResolvedValue(profile);

    const res = await harness.call("GET", "/me");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(profile);
    expect(harness.services.auth.getProfile).toHaveBeenCalledWith(USER.id);
  });

  it("PUT /me/password changes the password and answers 204", async () => {
    const body = { currentPassword: "old-secret", newPassword: "new-secret" };

    const res = await harness.call("PUT", "/me/password", { body });

    expect(res.status).toBe(204);
    expect(harness.services.auth.changePassword).toHaveBeenCalledWith(USER.id, body);
  });

  it("rejects a short, unchanged or extra-field password body before reaching the service", async () => {
    const short = await harness.call("PUT", "/me/password", { body: { currentPassword: "old-secret", newPassword: "123" } });
    const same = await harness.call("PUT", "/me/password", { body: { currentPassword: "same-pass", newPassword: "same-pass" } });
    const extra = await harness.call("PUT", "/me/password", {
      body: { currentPassword: "old-secret", newPassword: "new-secret", userId: "someone-else" }
    });

    expect([short.status, same.status, extra.status]).toEqual([400, 400, 400]);
    expect(harness.services.auth.changePassword).not.toHaveBeenCalled();
  });

  it("requires a token", async () => {
    expect((await harness.call("GET", "/me", { token: null })).status).toBe(401);
    expect((await harness.call("PUT", "/me/password", { token: null, body: {} })).status).toBe(401);
  });
});

describe("AuthService.changePassword", () => {
  async function setup() {
    const repo = {
      findById: vi.fn(async () => ({
        id: "u1",
        email: "a@b.com",
        password_hash: await hashPassword("old-secret"),
        created_at: "2026-01-01T00:00:00.000Z"
      })),
      updatePasswordHash: vi.fn()
    };
    vi.spyOn(console, "log").mockImplementation(() => {});
    return { repo, service: new AuthService(repo as unknown as AuthRepository, "test-secret") };
  }

  it("stores a new hash that verifies with the new password only", async () => {
    const { repo, service } = await setup();

    await service.changePassword("u1", { currentPassword: "old-secret", newPassword: "new-secret" });

    const [userId, newHash] = repo.updatePasswordHash.mock.calls[0];
    expect(userId).toBe("u1");
    await expect(verifyPassword("new-secret", newHash)).resolves.toMatchObject({ valid: true });
    await expect(verifyPassword("old-secret", newHash)).resolves.toMatchObject({ valid: false });
  });

  it("rejects a wrong current password with a 400 so the client stays signed in", async () => {
    const { repo, service } = await setup();

    await expect(
      service.changePassword("u1", { currentPassword: "wrong-pass", newPassword: "new-secret" })
    ).rejects.toMatchObject({ code: "AUTH_INVALID_CURRENT_PASSWORD", status: 400 });
    expect(repo.updatePasswordHash).not.toHaveBeenCalled();
  });

  it("returns the profile without the password hash", async () => {
    const { service } = await setup();

    await expect(service.getProfile("u1")).resolves.toEqual({
      id: "u1",
      email: "a@b.com",
      createdAt: "2026-01-01T00:00:00.000Z"
    });
  });
});
