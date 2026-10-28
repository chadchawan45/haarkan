import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getSystemAuditLogs } from "@/lib/shared-groups-store";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request, "audit.read");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const action = searchParams.get("action") || "all";

    let logs = getSystemAuditLogs(limit);

    if (q) {
      logs = logs.filter(
        (l) =>
          l.actorName?.toLowerCase().includes(q) ||
          l.actorEmail?.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.targetType.toLowerCase().includes(q) ||
          l.targetId?.toLowerCase().includes(q)
      );
    }

    if (action !== "all") {
      logs = logs.filter((l) => l.action.startsWith(action));
    }

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการโหลด Audit Logs" },
      { status: 500 }
    );
  }
}
