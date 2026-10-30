import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { hashPassword, verifyPassword } from "../src/common/password";
import type { AuthRepository } from "../src/modules/auth/auth.repository";
import { AuthService } from "../src/modules/auth/auth.service";

describe("Password hashing", () => {
  it("verifies a PBKDF2 hash and rejects a wrong password", async () => {
    const stored = await hashPassword("secret123");

    expect(stored.startsWith("pbkdf2-sha256$100000$")).toBe(true);
    await expect(verifyPassword("secret123", stored)).resolves.toEqual({ valid: true, needsRehash: false });
    await expect(verifyPassword("wrong-pass", stored)).resolves.toEqual({ valid: false, needsRehash: false });
  });

  it("accepts legacy bcrypt hashes and flags them for rehashing", async () => {
    const legacy = bcrypt.hashSync("secret123", 4);

    await expect(verifyPassword("secret123", legacy)).resolves.toEqual({ valid: true, needsRehash: true });
    await expect(verifyPassword("wrong-pass", legacy)).resolves.toEqual({ valid: false, needsRehash: false });
  });

  it("rejects unknown hash formats", async () => {
    await expect(verifyPassword("secret123", "garbage")).resolves.toEqual({ valid: false, needsRehash: false });
  });
});

describe("AuthService", () => {
  function setup(passwordHash: string) {
    const repo = {
      findByEmail: vi.fn(async () => ({ id: "u1", email: "a@b.com", password_hash: passwordHash, created_at: "" })),
      createUser: vi.fn(),
      updatePasswordHash: vi.fn()
    };
    return { repo, service: new AuthService(repo as unknown as AuthRepository, "test-secret") };
  }

  it("upgrades a legacy bcrypt hash on successful login", async () => {
    const { repo, service } = setup(bcrypt.hashSync("secret123", 4));

    await service.login({ email: "a@b.com", password: "secret123" });

    expect(repo.updatePasswordHash).toHaveBeenCalledWith("u1", expect.stringMatching(/^pbkdf2-sha256\$/));
  });

  it("issues a token that verifies back to the same user", async () => {
    const { service } = setup(await hashPassword("secret123"));

    const { accessToken } = await service.login({ email: "a@b.com", password: "secret123" });

    await expect(service.verifyAccessToken(accessToken)).resolves.toEqual({ id: "u1", email: "a@b.com" });
  });

  it("rejects a wrong password and a token signed with another secret", async () => {
    const { service } = setup(await hashPassword("secret123"));
    const other = new AuthService(setup(await hashPassword("secret123")).repo as unknown as AuthRepository, "other");
    const { accessToken } = await other.login({ email: "a@b.com", password: "secret123" });

    await expect(service.login({ email: "a@b.com", password: "nope-nope" })).rejects.toMatchObject({ status: 401 });
    await expect(service.verifyAccessToken(accessToken)).rejects.toMatchObject({ code: "AUTH_UNAUTHORIZED" });
  });
});
