import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await context.params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // สมาชิกเท่านั้นที่มีสิทธิ์ดูรายชื่อสมาชิก
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!myMembership) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงกลุ่มนี้" }, { status: 403 });
    }

    const { data: members, error } = await supabase
      .from("group_members")
      .select("id, user_id, role, status, created_at, profiles(display_name)")
      .eq("group_id", groupId)
      .neq("status", "removed")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const items = (members ?? []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      role: m.role,
      status: m.status,
      displayName: m.profiles?.display_name ?? "สมาชิก",
      createdAt: m.created_at,
    }));

    return NextResponse.json({ members: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
