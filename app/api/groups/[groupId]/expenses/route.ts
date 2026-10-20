import { NextRequest, NextResponse } from "next/server";
import { createExpenseSchema } from "@/lib/schemas";
import { customSplit, equalSplit, weightedSplit } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: { params: Promise<{ groupId: string }> }) {
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") ?? "active"; // active, voided, all
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const categoryId = searchParams.get("categoryId");

    let query = supabase
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
      .eq("group_id", groupId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (fromDate) {
      query = query.gte("expense_date", fromDate);
    }
    if (toDate) {
      query = query.lte("expense_date", toDate);
    }
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data: expenses, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    // Format ข้อมูลให้ UI นำไปใช้ง่าย
    const items = (expenses ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      expenseDate: e.expense_date,
      totalAmountSatang: e.total_amount_satang,
      splitMode: e.split_mode,
      note: e.note,
      status: e.status,
      voidReason: e.void_reason,
      createdAt: e.created_at,
      categoryName: e.category?.name_th ?? "ทั่วไป",
      payers: (e.expense_payers ?? []).map((p: any) => ({
        memberId: p.member_id,
        amountSatang: p.amount_satang,
        displayName: p.group_members?.profiles?.display_name ?? "สมาชิก",
      })),
      shares: (e.expense_shares ?? []).map((s: any) => ({
        memberId: s.member_id,
        amountSatang: s.amount_satang,
        weight: s.weight,
        displayName: s.group_members?.profiles?.display_name ?? "สมาชิก",
      })),
      myShareSatang:
        (e.expense_shares ?? []).find((s: any) => s.member_id === membership.id)?.amount_satang ?? 0,
      myPaidSatang:
        (e.expense_payers ?? []).find((p: any) => p.member_id === membership.id)?.amount_satang ?? 0,
    }));

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await context.params;
    const body = createExpenseSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "ข้อมูลรายจ่ายไม่ถูกต้อง", details: body.error.flatten() }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const value = body.data;
    const shares =
      value.splitMode === "equal"
        ? equalSplit(
            value.totalAmountSatang,
            value.shares.map((x) => x.memberId)
          )
        : value.splitMode === "custom"
        ? customSplit(value.totalAmountSatang, value.shares)
        : weightedSplit(
            value.totalAmountSatang,
            value.shares.map((x) => ({ memberId: x.memberId, weight: x.weight! }))
          );

    const { data, error } = await supabase.rpc("create_expense_atomic", {
      p_group_id: groupId,
      p_title: value.title,
      p_expense_date: value.expenseDate,
      p_total_amount_satang: value.totalAmountSatang,
      p_split_mode: value.splitMode,
      p_note: value.note ?? null,
      p_payers: value.payers,
      p_shares: shares,
    });

    if (error) {
      return NextResponse.json(
        { error: "ไม่สามารถบันทึกรายจ่าย", detail: error.message },
        { status: error.code === "42501" ? 403 : 422 }
      );
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
