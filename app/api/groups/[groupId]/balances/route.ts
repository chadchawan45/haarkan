import { NextRequest, NextResponse } from "next/server";
import { balances } from "@/lib/settlements";
import {
  fetchGroupFinanceData,
  toExpenses,
  toPayments,
} from "@/lib/group-finance";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const data = await fetchGroupFinanceData(groupId);

    if ("error" in data) {
      return data.error;
    }

    const balance = balances(toExpenses(data.expenses), toPayments(data.payments));

    const items = data.members.map((m: any) => ({
      memberId: m.id,
      displayName: m.profiles?.display_name ?? "สมาชิก",
      status: m.status,
      netBalanceSatang: balance.get(m.id) ?? 0,
    }));

    const totalSatang = items.reduce(
      (sum: number, x: { netBalanceSatang: number }) => sum + x.netBalanceSatang,
      0
    );

    return NextResponse.json({
      items,
      totalSatang,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "เกิดข้อผิดพลาดในการคำนวณยอดคงเหลือ" },
      { status: 500 }
    );
  }
}

// Re-export for any remaining references
export { fetchGroupFinanceData as finance };
