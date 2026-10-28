import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminToken,
  ADMIN_COOKIE_NAME,
  ROLE_PERMISSIONS,
  type SystemRole,
  type AdminSessionUser,
} from "@/lib/admin-auth";
import {
  getAllSharedData,
  addSystemAuditLog,
} from "@/lib/shared-groups-store";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์"),
  password: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลนำเข้าไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const cleanInput = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/[^0-9]/g, "");

    const store = getAllSharedData();
    const members = store.members || [];

    // Find member by email, phone, or ID
    const member = members.find((m) => {
      if (m.email && m.email.toLowerCase() === cleanInput) return true;
      if (cleanDigits.length >= 9 && m.phone && m.phone.replace(/[^0-9]/g, "") === cleanDigits) return true;
      if (m.id.toLowerCase() === cleanInput) return true;
      return false;
    });

    // Check if this is the default Super Admin (Golf) or an authorized system admin
    const isSuperAdminEmail =
      cleanInput === "golf2545mc@gmail.com" ||
      cleanInput === "mem-golf" ||
      (member && member.email?.toLowerCase() === "golf2545mc@gmail.com");

    const systemRole: SystemRole | null = isSuperAdminEmail
      ? "super_admin"
      : member?.systemRole && member.systemRole in ROLE_PERMISSIONS
      ? (member.systemRole as SystemRole)
      : null;

    // Check authorization: must be an admin role
    if (!systemRole) {
      addSystemAuditLog({
        actorName: identifier,
        actorEmail: identifier.includes("@") ? identifier : undefined,
        action: "admin.login_attempt",
        targetType: "auth",
        details: { reason: "Account not authorized for admin access" },
        status: "denied",
      });

      return NextResponse.json(
        {
          success: false,
          message: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบจัดการหลังบ้าน (Admin Dashboard)",
        },
        { status: 403 }
      );
    }

    // Verify password if member has a set password
    if (member && member.password && member.password !== password) {
      addSystemAuditLog({
        actorId: member.id,
        actorName: member.name,
        actorEmail: member.email,
        action: "admin.login_failed",
        targetType: "auth",
        details: { reason: "Invalid password" },
        status: "failure",
      });

      return NextResponse.json(
        { success: false, message: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" },
        { status: 401 }
      );
    }

    // If account is suspended
    if (member && member.status === "suspended") {
      addSystemAuditLog({
        actorId: member.id,
        actorName: member.name,
        actorEmail: member.email,
        action: "admin.login_denied",
        targetType: "auth",
        details: { reason: "Account is suspended" },
        status: "denied",
      });

      return NextResponse.json(
        { success: false, message: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบสูงสุด" },
        { status: 403 }
      );
    }

    const adminUser: AdminSessionUser = {
      id: member?.id || "mem-golf",
      name: member?.name || "Super Admin (กอล์ฟ)",
      email: member?.email || "golf2545mc@gmail.com",
      role: systemRole,
      permissions: ROLE_PERMISSIONS[systemRole],
    };

    const token = createAdminToken(adminUser, 24);

    // Audit log success
    addSystemAuditLog({
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorEmail: adminUser.email,
      action: "admin.login_success",
      targetType: "auth",
      details: { role: systemRole },
      status: "success",
    });

    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบหลังบ้านสำเร็จ",
      user: adminUser,
      token,
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" },
      { status: 500 }
    );
  }
}
