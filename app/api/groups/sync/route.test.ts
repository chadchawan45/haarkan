import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { createMemberToken } from "@/lib/user-auth";
import { createAdminToken, ROLE_PERMISSIONS } from "@/lib/admin-auth";
import { resetTestStore, writeStore, readStore } from "@/lib/shared-groups-store";

describe("API: /api/groups/sync security", () => {
  beforeEach(() => {
    resetTestStore();
    // Seed initial test store
    writeStore({
      groups: [
        {
          id: "grp-alpha",
          name: "กลุ่ม Alpha",
          code: "ALPHA1",
          creatorMemberId: "user-alice",
          memberIds: ["user-alice", "user-bob"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "grp-beta",
          name: "กลุ่ม Beta",
          code: "BETA22",
          creatorMemberId: "user-charlie",
          memberIds: ["user-charlie"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      expenses: [],
      payments: [],
      members: [
        { id: "user-alice", name: "Alice", email: "alice@test.local", role: "admin", status: "active", avatarColor: "#10b981" },
        { id: "user-bob", name: "Bob", email: "bob@test.local", role: "member", status: "active", avatarColor: "#3b82f6" },
        { id: "user-charlie", name: "Charlie", email: "charlie@test.local", role: "admin", status: "active", avatarColor: "#f59e0b" },
      ],
      notifications: [],
      backupVersions: [],
      siteSettings: {
        siteName: "หารกัน (HaarKan)",
        tagline: "Test",
        contactEmail: "admin@test.local",
        maintenanceMode: false,
        announcement: { active: false, title: "", content: "", type: "info" },
      },
      lastUpdated: new Date().toISOString(),
    });
  });

  it("rejects unauthenticated GET requests with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/groups/sync", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain("กรุณาเข้าสู่ระบบ");
  });

  it("scopes GET results to member's groups only", async () => {
    const token = createMemberToken({
      id: "user-bob",
      name: "Bob",
      email: "bob@test.local",
      role: "member",
    });

    const req = new NextRequest("http://localhost:3000/api/groups/sync", {
      method: "GET",
      headers: {
        cookie: `haarkan_member_session=${token}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    // Bob only belongs to Alpha, not Beta
    expect(body.groups).toHaveLength(1);
    expect(body.groups[0].id).toBe("grp-alpha");
  });

  it("rejects unauthorized group deletion with 403 when user is not creator", async () => {
    const token = createMemberToken({
      id: "user-bob",
      name: "Bob",
      email: "bob@test.local",
      role: "member",
    });

    const req = new NextRequest("http://localhost:3000/api/groups/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `haarkan_member_session=${token}`,
      },
      body: JSON.stringify({
        deletedGroupId: "grp-beta", // Bob is not even in Beta
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain("ไม่มีสิทธิ์ลบกลุ่ม");

    // Verify Beta was NOT deleted in store
    const store = readStore();
    expect(store.groups.find((g: any) => g.id === "grp-beta")).toBeDefined();
  });

  it("allows group creator to delete their own group", async () => {
    const token = createMemberToken({
      id: "user-charlie",
      name: "Charlie",
      email: "charlie@test.local",
      role: "admin",
    });

    const req = new NextRequest("http://localhost:3000/api/groups/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `haarkan_member_session=${token}`,
      },
      body: JSON.stringify({
        deletedGroupId: "grp-beta",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify Beta WAS deleted
    const store = readStore();
    expect(store.groups.find((g: any) => g.id === "grp-beta")).toBeUndefined();
  });
});
