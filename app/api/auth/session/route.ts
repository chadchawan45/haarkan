import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllSharedData, updateUserByAdmin } from "@/lib/shared-groups-store";
import { createMemberToken, MEMBER_COOKIE_NAME } from "@/lib/user-auth";
import { verifyPassword, hashPassword } from "@/lib/password";

const sessionSchema = z.object({
  memberId: z.string().min(1, "กรุณาระบุ ID สมาชิก"),
  password: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { memberId, password } = parsed.data;
    const store = getAllSharedData();
    const members = store.members || [];
    const member = members.find((m) => m.id === memberId);

    if (!member) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลสมาชิกในระบบ" },
        { status: 404 }
      );
    }

    if (member.status === "suspended") {
      return NextResponse.json(
        { success: false, message: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 403 }
      );
    }

    // If password is provided and member has a password, verify it
    if (password && member.password) {
      const isValid = verifyPassword(password, member.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "รหัสผ่านไม่ถูกต้อง" },
          { status: 401 }
        );
      }

      // Upgrade plain text to scrypt hash if needed
      if (!member.password.startsWith("scrypt:")) {
        try {
          const upgraded = hashPassword(password);
          updateUserByAdmin(member.id, { password: upgraded } as any);
        } catch {}
      }
    }

    const token = createMemberToken({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
    });

    const response = NextResponse.json({
      success: true,
      message: "สร้างเซสชันสำเร็จ",
      token,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
      },
    });

    response.cookies.set({
      name: MEMBER_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการสร้างเซสชัน" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "ออกจากระบบเรียบร้อยแล้ว",
  });

  response.cookies.set({
    name: MEMBER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
