import { describe, it, expect } from "vitest";
import {
  createMemberToken,
  verifyMemberToken,
  type MemberSessionUser,
} from "./user-auth";

describe("user-auth module", () => {
  const sampleMember: MemberSessionUser = {
    id: "mem-test-1",
    name: "สมชาย",
    email: "somchai@test.local",
    role: "admin",
  };

  it("creates and verifies a valid member token", () => {
    const token = createMemberToken(sampleMember, 7);
    expect(typeof token).toBe("string");
    expect(token.includes(".")).toBe(true);

    const verified = verifyMemberToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe("mem-test-1");
    expect(verified?.name).toBe("สมชาย");
    expect(verified?.email).toBe("somchai@test.local");
  });

  it("rejects tampered member tokens", () => {
    const token = createMemberToken(sampleMember);
    const tampered = token.slice(0, -6) + "xxxxxx";
    const verified = verifyMemberToken(tampered);
    expect(verified).toBeNull();
  });

  it("rejects expired member tokens", () => {
    const token = createMemberToken(sampleMember, -1);
    const verified = verifyMemberToken(token);
    expect(verified).toBeNull();
  });
});
