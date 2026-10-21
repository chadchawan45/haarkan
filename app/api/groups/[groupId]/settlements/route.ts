import { NextRequest, NextResponse } from "next/server";
import { directSettlements, balances, optimizedSettlements } from "@/lib/settlements";
import { fetchGroupFinanceData, toExpenses, toPayments } from "@/lib/group-finance";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const mode = request.nextUrl.searchParams.get("mode") ?? "optimized";

    if (mode !== "direct" && mode !== "optimized") {
      return NextResponse.json(
        { error: "mode ต้องเป็น direct หรือ optimized" },
        { status: 400 }
      );
    }

    const data = await fetchGroupFinanceData(groupId);
    if ("error" in data) {
      return data.error;
    }

    const transactions =
      mode === "direct"
        ? directSettlements(toExpenses(data.expenses))
        : optimizedSettlements(balances(toExpenses(data.expenses), toPayments(data.payments)));

    const names = new Map(
      data.members.map((m: any) => [m.id, m.profiles?.display_name ?? "สมาชิก"])
    );

    return NextResponse.json({
      mode,
      items: transactions.map((x) => ({
        ...x,
        fromMemberName: names.get(x.fromMemberId),
        toMemberName: names.get(x.toMemberId),
      })),
      note: "เป็นข้อเสนอจากยอดปัจจุบัน และอาจเปลี่ยนเมื่อมีรายการใหม่หรือยืนยันการชำระเงิน",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "เกิดข้อผิดพลาดในการคำนวณการชำระเงิน" },
      { status: 500 }
    );
  }
}
