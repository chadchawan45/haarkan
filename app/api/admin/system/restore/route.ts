import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { restoreStoreData, addSystemAuditLog } from "@/lib/shared-groups-store";

export async function POST(request: NextRequest) {
  // Only Super Admin can restore database backups
  const auth = requireAdminAuth(request);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  if (auth.user.role !== "super_admin") {
    return NextResponse.json(
      { success: false, message: "เฉพาะ Super Admin เท่านั้นที่สามารถกู้คืนข้อมูลระบบได้" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "ข้อมูลสำรองไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const payload = body.data || body;
    const result = restoreStoreData(payload);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    addSystemAuditLog({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      action: "system.restore_backup",
      targetType: "system",
      details: {
        restoredGroupsCount: Array.isArray(payload.groups) ? payload.groups.length : 0,
        restoredMembersCount: Array.isArray(payload.members) ? payload.members.length : 0,
        restoredExpensesCount: Array.isArray(payload.expenses) ? payload.expenses.length : 0,
      },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการกู้คืนข้อมูล" },
      { status: 500 }
    );
  }
}
