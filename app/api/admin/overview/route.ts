import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getAdminOverviewStats } from "@/lib/shared-groups-store";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const stats = getAdminOverviewStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ" },
      { status: 500 }
    );
  }
}
