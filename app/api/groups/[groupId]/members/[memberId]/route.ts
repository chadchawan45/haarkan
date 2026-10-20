import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const patchMemberSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const { groupId, memberId } = await context.params;
    const body = await request.json();
    const parsed = patchMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // ตรวจสอบว่าผู้เรียกเป็น admin ของกลุ่ม
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (!myMembership) {
      return NextResponse.json({ error: "เฉพาะผู้ดูแลกลุ่มเท่านั้นที่แก้ไขสมาชิกได้" }, { status: 403 });
    }

    const { data: targetMember } = await supabase
      .from("group_members")
      .select("*")
      .eq("id", memberId)
      .eq("group_id", groupId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (parsed.data.role) updates.role = parsed.data.role;
    if (parsed.data.status) updates.status = parsed.data.status;

    const { error } = await supabase.from("group_members").update(updates).eq("id", memberId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    // บันทึก audit log
    await supabase.from("audit_logs").insert({
      group_id: groupId,
      actor_user_id: user.id,
      entity_type: "member",
      entity_id: memberId,
      action: "updated",
      before_data: { role: targetMember.role, status: targetMember.status },
      after_data: updates,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const { groupId, memberId } = await context.params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // Admin only
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .maybeSingle();

    if (!myMembership) {
      return NextResponse.json({ error: "เฉพาะผู้ดูแลกลุ่มเท่านั้นที่จัดการสมาชิกได้" }, { status: 403 });
    }

    // Soft delete / inactive ตามกฎไม่ลบทำลายข้อมูล
    const { data: targetMember } = await supabase
      .from("group_members")
      .select("*")
      .eq("id", memberId)
      .eq("group_id", groupId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    }

    // ปรับ status เป็น inactive
    const { error } = await supabase
      .from("group_members")
      .update({ status: "inactive" })
      .eq("id", memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    await supabase.from("audit_logs").insert({
      group_id: groupId,
      actor_user_id: user.id,
      entity_type: "member",
      entity_id: memberId,
      action: "deactivated",
      before_data: { status: targetMember.status },
      after_data: { status: "inactive" },
    });

    return NextResponse.json({ ok: true, message: "ปิดการใช้งานสมาชิกเรียบร้อยแล้ว" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
