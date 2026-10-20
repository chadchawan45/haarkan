import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createGroupSchema = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่อกลุ่ม").max(120),
  description: z.string().trim().max(500).optional(),
  weekStartsOn: z.number().int().min(0).max(6).default(1),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // ดึงกลุ่มที่ user เป็นสมาชิกและไม่ถูก removed
    const { data, error } = await supabase
      .from("group_members")
      .select("role, status, groups(id, name, description, week_starts_on, default_currency, created_at)")
      .eq("user_id", user.id)
      .neq("status", "removed")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const groups = (data ?? []).map((m: any) => ({
      ...m.groups,
      role: m.role,
      status: m.status,
    }));

    return NextResponse.json({ groups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาดในการโหลดกลุ่ม" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลกลุ่มไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { name, description, weekStartsOn } = parsed.data;
    const { data, error } = await supabase.rpc("create_group_atomic", {
      p_name: name,
      p_description: description ?? null,
      p_week_starts_on: weekStartsOn,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาดในการสร้างกลุ่ม" }, { status: 500 });
  }
}
