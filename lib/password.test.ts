import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password utility", () => {
  it("hashes password with salt and verifies successfully", () => {
    const raw = "MySecureP@ssword2026!";
    const hashed = hashPassword(raw);

    expect(hashed.startsWith("scrypt:")).toBe(true);
    expect(hashed).not.toBe(raw);
    expect(verifyPassword(raw, hashed)).toBe(true);
  });

  it("rejects incorrect passwords", () => {
    const hashed = hashPassword("CorrectPassword123");
    expect(verifyPassword("WrongPassword", hashed)).toBe(false);
    expect(verifyPassword("", hashed)).toBe(false);
  });

  it("generates unique salts for identical passwords", () => {
    const pass = "SamePassword";
    const hash1 = hashPassword(pass);
    const hash2 = hashPassword(pass);
    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(pass, hash1)).toBe(true);
    expect(verifyPassword(pass, hash2)).toBe(true);
  });

  it("rejects empty password hashing", () => {
    expect(() => hashPassword("")).toThrow();
  });
});
