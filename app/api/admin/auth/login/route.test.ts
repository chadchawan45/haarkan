import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { resetTestStore, writeStore, readStore } from "@/lib/shared-groups-store";
import { hashPassword } from "@/lib/password";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

describe("API: /api/admin/auth/login", () => {
  beforeEach(() => {
    resetTestStore();
    const adminPasswordHash = hashPassword("superSecretPass123");

    writeStore({
      groups: [],
      expenses: [],
      payments: [],
      members: [
        {
          id: "mem-admin",
          name: "System Admin",
          email: "admin@haarkan.local",
          role: "admin",
          systemRole: "admin",
          status: "active",
          password: adminPasswordHash,
          avatarColor: "#10b981",
        },
        {
          id: "mem-normal",
          name: "Normal User",
          email: "user@haarkan.local",
          role: "member",
          systemRole: "member",
          status: "active",
          password: hashPassword("userPass123"),
          avatarColor: "#3b82f6",
        },
      ],
      notifications: [],
      backupVersions: [],
      siteSettings: {
        siteName: "หารกัน",
        tagline: "Test",
        contactEmail: "admin@haarkan.local",
        maintenanceMode: false,
        announcement: { active: false, title: "", content: "", type: "info" },
      },
      lastUpdated: new Date().toISOString(),
    });
  });

  it("rejects login if password is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "admin@haarkan.local", password: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("rejects non-admin members with 403", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "user@haarkan.local",
        password: "userPass123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain("ไม่มีสิทธิ์เข้าถึงระบบจัดการหลังบ้าน");
  });

  it("rejects incorrect admin password with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "admin@haarkan.local",
        password: "WrongPassword999",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain("รหัสผ่านไม่ถูกต้อง");
  });

  it("authenticates admin with valid credentials and sets cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "admin@haarkan.local",
        password: "superSecretPass123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBe("admin@haarkan.local");
    expect(body.user.role).toBe("admin");
    expect(body.token).toBeDefined();

    // Verify Set-Cookie header contains admin token
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(ADMIN_COOKIE_NAME);
  });
});
