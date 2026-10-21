import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
});

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

    // ตรวจสอบสิทธิ์การเป็นสมาชิก
    const { data: membership, error: memErr } = await supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (memErr || !membership) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงกลุ่มนี้" }, { status: 403 });
    }

    const { data: group, error: groupErr } = await supabase
      .from("groups")
      .select("id, name, description, week_starts_on, default_currency, created_by, created_at")
      .eq("id", groupId)
      .single();

    if (groupErr || !group) {
      return NextResponse.json({ error: "ไม่พบข้อมูลกลุ่ม" }, { status: 404 });
    }

    return NextResponse.json({
      group: {
        ...group,
        myRole: membership.role,
        myStatus: membership.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await context.params;
    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);
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

    // ตรวจสอบว่าเป็น admin ของกลุ่มหรือไม่
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "เฉพาะผู้ดูแลกลุ่ม (Admin) เท่านั้นที่แก้ไขการตั้งค่าได้" }, { status: 403 });
    }

    const updates: Record<string, any> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.weekStartsOn !== undefined) updates.week_starts_on = parsed.data.weekStartsOn;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { data: oldGroup } = await supabase.from("groups").select("*").eq("id", groupId).single();

    const { error } = await supabase.from("groups").update(updates).eq("id", groupId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      group_id: groupId,
      actor_user_id: user.id,
      entity_type: "group",
      entity_id: groupId,
      action: "updated",
      before_data: oldGroup,
      after_data: updates,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(
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

    // ตรวจสอบสิทธิ์ว่าเป็น admin หรือผู้สร้างกลุ่ม
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "เฉพาะผู้ดูแลกลุ่ม (Admin) เท่านั้นที่สามารถลบห้องได้" },
        { status: 403 }
      );
    }

    const { data: group } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      group_id: groupId,
      actor_user_id: user.id,
      entity_type: "group",
      entity_id: groupId,
      action: "deleted",
      before_data: group,
    });

    return NextResponse.json({ ok: true, message: "ลบห้องเรียบร้อยแล้ว" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

