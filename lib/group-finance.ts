import { NextResponse } from "next/server";
import type { Expense, Payment } from "@/lib/settlements";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GroupMember = {
  id: string;
  userId: string;
  displayName: string;
  status: "active" | "inactive" | "removed";
};

export type ExpenseRow = {
  id: string;
  status: "active" | "voided";
  expense_payers: { member_id: string; amount_satang: number }[];
  expense_shares: { member_id: string; amount_satang: number }[];
};

export type PaymentRow = {
  status: Payment["status"];
  from_member_id: string;
  to_member_id: string;
  amount_satang: number;
};

export const toExpenses = (rows: ExpenseRow[]): Expense[] =>
  rows.map((x) => ({
    status: x.status,
    payers: x.expense_payers.map((p) => ({
      memberId: p.member_id,
      amountSatang: p.amount_satang,
    })),
    shares: x.expense_shares.map((s) => ({
      memberId: s.member_id,
      amountSatang: s.amount_satang,
    })),
  }));

export const toPayments = (rows: PaymentRow[]): Payment[] =>
  rows.map((x) => ({
    status: x.status,
    fromMemberId: x.from_member_id,
    toMemberId: x.to_member_id,
    amountSatang: x.amount_satang,
  }));

export type FinanceResult =
  | { error: NextResponse }
  | {
      members: any[];
      expenses: ExpenseRow[];
      payments: PaymentRow[];
    };

/**
 * ดึงข้อมูลการเงิน สมาชิก รายจ่าย และการชำระเงินของกลุ่ม พร้อมตรวจสอบสิทธิ์การเข้าถึง
 */
export async function fetchGroupFinanceData(groupId: string): Promise<FinanceResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .neq("status", "removed")
    .maybeSingle();

  if (!membership) {
    return { error: NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงกลุ่มนี้" }, { status: 403 }) };
  }

  const [
    { data: members, error: memberError },
    { data: expenses, error: expenseError },
    { data: payments, error: paymentError },
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select("id, user_id, status, profiles(display_name)")
      .eq("group_id", groupId)
      .neq("status", "removed"),
    supabase
      .from("expenses")
      .select("id, status, expense_payers(member_id, amount_satang), expense_shares(member_id, amount_satang)")
      .eq("group_id", groupId),
    supabase
      .from("payments")
      .select("status, from_member_id, to_member_id, amount_satang")
      .eq("group_id", groupId),
  ]);

  if (memberError || expenseError || paymentError) {
    return { error: NextResponse.json({ error: "ไม่สามารถอ่านข้อมูลยอดคงเหลือ" }, { status: 422 }) };
  }

  return {
    members: members ?? [],
    expenses: (expenses ?? []) as unknown as ExpenseRow[],
    payments: (payments ?? []) as unknown as PaymentRow[],
  };
}

// Alias for backwards compatibility
export const finance = fetchGroupFinanceData;
