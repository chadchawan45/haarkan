import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const { groupId, expenseId } = await context.params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์สมาชิก
    const { data: membership } = await supabase
      .from("group_members")
      .select("id, role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงกลุ่มนี้" }, { status: 403 });
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .select(
        `
        id,
        title,
        expense_date,
        total_amount_satang,
        split_mode,
        note,
        status,
        void_reason,
        created_at,
        created_by,
        category:expense_categories(id, name_th),
        expense_payers(
          member_id,
          amount_satang,
          group_members(id, user_id, profiles(display_name))
        ),
        expense_shares(
          member_id,
          amount_satang,
          weight,
          group_members(id, user_id, profiles(display_name))
        )
      `
      )
      .eq("id", expenseId)
      .eq("group_id", groupId)
      .single();

    if (error || !expense) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรายจ่าย" }, { status: 404 });
    }

    // ดึง audit logs ที่เกี่ยวข้องกับ expense นี้
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("id, action, before_data, after_data, created_at, actor:profiles(display_name)")
      .eq("group_id", groupId)
      .eq("entity_type", "expense")
      .eq("entity_id", expenseId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      expense: {
        id: expense.id,
        title: expense.title,
        expenseDate: expense.expense_date,
        totalAmountSatang: expense.total_amount_satang,
        splitMode: expense.split_mode,
        note: expense.note,
        status: expense.status,
        voidReason: expense.void_reason,
        createdAt: expense.created_at,
        categoryName: (expense.category as any)?.name_th ?? "ทั่วไป",
        payers: (expense.expense_payers ?? []).map((p: any) => ({
          memberId: p.member_id,
          amountSatang: p.amount_satang,
          displayName: p.group_members?.profiles?.display_name ?? "สมาชิก",
        })),
        shares: (expense.expense_shares ?? []).map((s: any) => ({
          memberId: s.member_id,
          amountSatang: s.amount_satang,
          weight: s.weight,
          displayName: s.group_members?.profiles?.display_name ?? "สมาชิก",
        })),
        auditLogs: auditLogs ?? [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
