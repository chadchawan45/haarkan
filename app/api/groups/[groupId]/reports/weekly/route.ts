import { NextRequest, NextResponse } from "next/server";
import { startOfWeek, endOfWeek } from "@/lib/periods";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
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

    // ตรวจสอบสิทธิ์และอ่าน week_starts_on ของกลุ่ม
    const { data: group } = await supabase
      .from("groups")
      .select("id, name, week_starts_on")
      .eq("id", groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "ไม่พบกลุ่ม" }, { status: 404 });
    }

    const dateParam = request.nextUrl.searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const start = startOfWeek(targetDate, group.week_starts_on);
    const end = endOfWeek(targetDate, group.week_starts_on);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select(
        `
        id,
        title,
        expense_date,
        total_amount_satang,
        category:expense_categories(id, name_th),
        expense_payers(member_id, amount_satang, group_members(profiles(display_name))),
        expense_shares(member_id, amount_satang, group_members(profiles(display_name)))
      `
      )
      .eq("group_id", groupId)
      .eq("status", "active")
      .gte("expense_date", startStr)
      .lte("expense_date", endStr);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const items = expenses ?? [];
    const totalSatang = items.reduce((sum, e) => sum + e.total_amount_satang, 0);

    // สรุปตามหมวดหมู่
    const categoryMap = new Map<string, { name: string; amountSatang: number; count: number }>();
    for (const exp of items) {
      const catName = (exp.category as any)?.name_th ?? "ทั่วไป";
      const cur = categoryMap.get(catName) ?? { name: catName, amountSatang: 0, count: 0 };
      cur.amountSatang += exp.total_amount_satang;
      cur.count += 1;
      categoryMap.set(catName, cur);
    }

    // สรุปภาระ/การจ่ายของสมาชิก
    const memberMap = new Map<
      string,
      { memberId: string; displayName: string; shareSatang: number; paidSatang: number }
    >();
    for (const exp of items) {
      for (const p of exp.expense_payers ?? []) {
        const name = (p as any).group_members?.profiles?.display_name ?? "สมาชิก";
        const cur = memberMap.get(p.member_id) ?? {
          memberId: p.member_id,
          displayName: name,
          shareSatang: 0,
          paidSatang: 0,
        };
        cur.paidSatang += p.amount_satang;
        memberMap.set(p.member_id, cur);
      }
      for (const s of exp.expense_shares ?? []) {
        const name = (s as any).group_members?.profiles?.display_name ?? "สมาชิก";
        const cur = memberMap.get(s.member_id) ?? {
          memberId: s.member_id,
          displayName: name,
          shareSatang: 0,
          paidSatang: 0,
        };
        cur.shareSatang += s.amount_satang;
        memberMap.set(s.member_id, cur);
      }
    }

    return NextResponse.json({
      period: {
        startDate: startStr,
        endDate: endStr,
        weekStartsOn: group.week_starts_on,
      },
      totalSatang,
      expenseCount: items.length,
      categoryBreakdown: Array.from(categoryMap.values()),
      memberBreakdown: Array.from(memberMap.values()),
      expenses: items.map((e) => ({
        id: e.id,
        title: e.title,
        expenseDate: e.expense_date,
        totalAmountSatang: e.total_amount_satang,
        categoryName: (e.category as any)?.name_th ?? "ทั่วไป",
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
