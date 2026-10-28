import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFromRequest, requireAdminAuth } from "@/lib/admin-auth";
import {
  getSiteSettings,
  updateSiteSettings,
  addSystemAuditLog,
} from "@/lib/shared-groups-store";

export async function GET(request: NextRequest) {
  try {
    const adminUser = getAdminFromRequest(request);
    const settings = getSiteSettings();

    // If not admin, return only public settings
    if (!adminUser) {
      return NextResponse.json({
        success: true,
        settings: {
          siteName: settings.siteName,
          tagline: settings.tagline,
          maintenanceMode: settings.maintenanceMode,
          announcement: settings.announcement,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการโหลดการตั้งค่า" },
      { status: 500 }
    );
  }
}

const settingsSchema = z.object({
  siteName: z.string().trim().min(1).optional(),
  tagline: z.string().trim().optional(),
  contactEmail: z.string().email().optional(),
  maintenanceMode: z.boolean().optional(),
  announcement: z
    .object({
      active: z.boolean(),
      title: z.string().default(""),
      content: z.string().default(""),
      type: z.enum(["info", "warning", "alert"]).default("info"),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request, "settings.write");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลการตั้งค่าไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = updateSiteSettings(parsed.data);

    addSystemAuditLog({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      action: "settings.update",
      targetType: "settings",
      details: { changedKeys: Object.keys(parsed.data) },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกการตั้งค่าเว็บไซต์สำเร็จ",
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า" },
      { status: 500 }
    );
  }
}
