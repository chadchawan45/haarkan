import { NextRequest, NextResponse } from "next/server";
import { findGroupByCode, joinGroupByCodeOnServer } from "@/lib/shared-groups-store";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const clean = (code || "").trim().toUpperCase();
    if (!clean || clean.length < 3) {
      return NextResponse.json(
        { success: false, message: "รหัสกลุ่มต้องมีความยาวอย่างน้อย 3-6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const result = findGroupByCode(clean);
    if (!result.group) {
      return NextResponse.json(
        { success: false, message: `ไม่พบกลุ่มที่ตรงกับรหัส "${clean}" กรุณาตรวจสอบรหัสอีกครั้ง` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      group: result.group,
      expenses: result.expenses,
      payments: result.payments,
      members: result.members,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการค้นหากลุ่ม" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const clean = (code || "").trim().toUpperCase();
    if (!clean || clean.length < 3) {
      return NextResponse.json(
        { success: false, message: "รหัสกลุ่มต้องมีความยาวอย่างน้อย 3-6 ตัวอักษร" },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const result = joinGroupByCodeOnServer(clean, body.member);
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการเข้าร่วมกลุ่ม" },
      { status: 500 }
    );
  }
}
