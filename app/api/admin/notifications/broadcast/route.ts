import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/admin-auth";
import { broadcastNotification, addSystemAuditLog } from "@/lib/shared-groups-store";

const broadcastSchema = z.object({
  title: z.string().trim().min(1, "กรุณาระบุหัวข้อประกาศ"),
  body: z.string().trim().min(1, "กรุณาระบุเนื้อหาประกาศ"),
  type: z.string().default("broadcast"),
  link: z.string().optional().default("/"),
});

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request, "settings.write");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลประกาศไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, body: notifBody, type, link } = parsed.data;

    const result = broadcastNotification({
      title,
      body: notifBody,
      type,
      link,
    });

    addSystemAuditLog({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      action: "notifications.broadcast",
      targetType: "notification",
      details: { title, targetMembersCount: result.count },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `ส่งการแจ้งเตือนถึงสมาชิกทั้งหมดเรียบร้อยแล้ว (${result.count} บัญชี)`,
      notification: result.notification,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการส่งแจ้งเตือน" },
      { status: 500 }
    );
  }
}
