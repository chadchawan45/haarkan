import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getAllUsersForAdmin,
  updateUserByAdmin,
  addSystemAuditLog,
} from "@/lib/shared-groups-store";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request, "users.read");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const status = searchParams.get("status") || "all";
    const role = searchParams.get("role") || "all";

    let users = getAllUsersForAdmin();

    if (q) {
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.nickname?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    if (status !== "all") {
      users = users.filter((u) => u.status === status);
    }

    if (role !== "all") {
      users = users.filter((u) => u.systemRole === role);
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการโหลดรายชื่อผู้ใช้" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  userId: z.string().min(1, "กรุณาระบุ ID ผู้ใช้"),
  status: z.enum(["active", "suspended", "removed"]).optional(),
  systemRole: z.enum(["super_admin", "admin", "editor", "support", "analyst", "member"]).optional(),
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const auth = requireAdminAuth(request, "users.write");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลที่ส่งมาไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, ...updates } = parsed.data;

    // Safety check: Only super_admin can assign or change super_admin role
    if (updates.systemRole === "super_admin" && auth.user.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "เฉพาะ Super Admin เท่านั้นที่สามารถแต่งตั้ง Super Admin ได้" },
        { status: 403 }
      );
    }

    const result = updateUserByAdmin(userId, updates);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    // Log this action to system audit logs
    addSystemAuditLog({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      action: "user.update",
      targetType: "user",
      targetId: userId,
      details: { updates },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้" },
      { status: 500 }
    );
  }
}
