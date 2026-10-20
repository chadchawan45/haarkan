import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isLineConfigured } from "@/lib/line";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const connectSchema = z.object({
  lineUserId: z.string().trim().min(5).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = connectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูล LINE ID ไม่ถูกต้อง" }, { status: 400 });
    }

    // บันทึก line_user_id ลง profile
    const { error } = await supabase
      .from("profiles")
      .update({ line_user_id: parsed.data.lineUserId })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      lineConfigured: isLineConfigured(),
      message: isLineConfigured()
        ? "เชื่อมต่อบัญชี LINE เรียบร้อยแล้ว"
        : "บันทึก LINE ID แล้ว (ระบบแจ้งเตือนจริงจะเปิดใช้งานเมื่อตั้งค่า LINE credentials ฝั่ง server)",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
