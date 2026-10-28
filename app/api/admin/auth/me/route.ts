import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const user = getAdminFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "ไม่ได้เข้าสู่ระบบผู้ดูแล" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user,
  });
}
