import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const voidSchema = z.object({
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผลในการยกเลิก").max(500),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const { groupId, expenseId } = await context.params;
    const body = await request.json();
    const parsed = voidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // ตรวจสอบว่าเป็น admin ของกลุ่ม
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "เฉพาะผู้ดูแลกลุ่ม (Admin) เท่านั้นที่สามารถยกเลิกรายจ่ายได้" }, { status: 403 });
    }

    // เรียกใช้ void_expense RPC ที่เตรียมไว้ใน migration
    const { error } = await supabase.rpc("void_expense", {
      p_expense_id: expenseId,
      p_void_reason: parsed.data.reason,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ ok: true, message: "ยกเลิกรายจ่ายเรียบร้อยแล้ว" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
