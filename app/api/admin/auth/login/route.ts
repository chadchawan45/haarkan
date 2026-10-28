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
  updateUserByAdmin,
} from "@/lib/shared-groups-store";
import { verifyPassword, hashPassword } from "@/lib/password";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่านเพื่อยืนยันตัวตน"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกทั้งอีเมล/เบอร์โทรศัพท์และรหัสผ่าน", details: parsed.error.flatten() },
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

    // Determine configured Super Admin email from environment or member role
    const configuredSuperAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const isConfiguredSuperAdmin =
      configuredSuperAdminEmail &&
      (cleanInput === configuredSuperAdminEmail ||
        (member && member.email?.toLowerCase() === configuredSuperAdminEmail));

    let systemRole: SystemRole | null = null;
    if (isConfiguredSuperAdmin) {
      systemRole = "super_admin";
    } else if (member?.systemRole && member.systemRole in ROLE_PERMISSIONS && member.systemRole !== "member") {
      systemRole = member.systemRole as SystemRole;
    }

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

    // Must have a valid member record and a configured password hash
    if (!member || !member.password) {
      addSystemAuditLog({
        actorName: identifier,
        action: "admin.login_denied",
        targetType: "auth",
        details: { reason: "Account has no password configured" },
        status: "denied",
      });

      return NextResponse.json(
        {
          success: false,
          message: "บัญชีนี้ยังไม่ได้กำหนดรหัสผ่านความปลอดภัย กรุณาตั้งรหัสผ่านก่อนเข้าสู่ระบบหลังบ้าน",
        },
        { status: 403 }
      );
    }

    // STRICT PASSWORD VERIFICATION
    const isPasswordValid = verifyPassword(password, member.password);
    if (!isPasswordValid) {
      addSystemAuditLog({
        actorId: member.id,
        actorName: member.name,
        actorEmail: member.email,
        action: "admin.login_failed",
        targetType: "auth",
        details: { reason: "Invalid password provided" },
        status: "failure",
      });

      return NextResponse.json(
        { success: false, message: "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง" },
        { status: 401 }
      );
    }

    // If legacy plain text password was verified, upgrade hash immediately to scrypt format
    if (!member.password.startsWith("scrypt:")) {
      try {
        const upgradedHash = hashPassword(password);
        updateUserByAdmin(member.id, { password: upgradedHash } as any);
      } catch {}
    }

    // If account is suspended
    if (member.status === "suspended") {
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
      id: member.id,
      name: member.name,
      email: member.email || identifier,
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
