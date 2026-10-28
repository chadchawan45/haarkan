import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { addSystemAuditLog } from "@/lib/shared-groups-store";

export async function POST(request: NextRequest) {
  const user = getAdminFromRequest(request);

  if (user) {
    addSystemAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      action: "admin.logout",
      targetType: "auth",
      details: { role: user.role },
      status: "success",
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "ออกจากระบบเรียบร้อยแล้ว",
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
