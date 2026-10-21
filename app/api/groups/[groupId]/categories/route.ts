import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // ตรวจสอบว่า user เป็นสมาชิกของกลุ่ม
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงกลุ่มนี้" }, { status: 403 });
    }

    // ดึงหมวดหมู่ที่เป็น global (group_id is null) หรือของกลุ่มนี้โดยเฉพาะ
    const { data: categories, error } = await supabase
      .from("expense_categories")
      .select("id, name_th, is_active, sort_order")
      .or(`group_id.is.null,group_id.eq.${groupId}`)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ categories: categories ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
