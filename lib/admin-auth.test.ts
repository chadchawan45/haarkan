import { describe, it, expect } from "vitest";
import {
  createAdminToken,
  verifyAdminToken,
  hasPermission,
  ROLE_PERMISSIONS,
  type AdminSessionUser,
} from "./admin-auth";

describe("admin-auth module", () => {
  const sampleUser: AdminSessionUser = {
    id: "mem-golf",
    name: "กอล์ฟ (ผู้ดูแลระบบ)",
    email: "golf2545mc@gmail.com",
    role: "super_admin",
    permissions: ROLE_PERMISSIONS["super_admin"],
  };

  it("creates and verifies a valid admin token", () => {
    const token = createAdminToken(sampleUser, 2);
    expect(typeof token).toBe("string");
    expect(token.includes(".")).toBe(true);

    const verified = verifyAdminToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe("mem-golf");
    expect(verified?.email).toBe("golf2545mc@gmail.com");
    expect(verified?.role).toBe("super_admin");
  });

  it("rejects tampered tokens", () => {
    const token = createAdminToken(sampleUser);
    const tampered = token.slice(0, -4) + "abcd";
    const verified = verifyAdminToken(tampered);
    expect(verified).toBeNull();
  });

  it("rejects expired tokens", () => {
    // Expires in negative hours (already expired)
    const token = createAdminToken(sampleUser, -1);
    const verified = verifyAdminToken(token);
    expect(verified).toBeNull();
  });

  it("checks permissions properly across roles", () => {
    expect(hasPermission("super_admin", "any.permission")).toBe(true);
    expect(hasPermission("admin", "users.write")).toBe(true);
    expect(hasPermission("support", "users.read")).toBe(true);
    expect(hasPermission("support", "users.write")).toBe(false);
    expect(hasPermission("analyst", "reports.export")).toBe(true);
    expect(hasPermission("analyst", "users.write")).toBe(false);
  });
});
