import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, group_id, type, title, body, data, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const items = data ?? [];
    const unreadCount = items.filter((x) => !x.read_at).length;

    return NextResponse.json({
      items,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "เกิดข้อผิดพลาดในการดึงการแจ้งเตือน" },
      { status: 500 }
    );
  }
}
