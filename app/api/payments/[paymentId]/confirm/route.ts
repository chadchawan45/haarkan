import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await context.params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { error } = await supabase.rpc("decide_payment", {
      p_payment_id: paymentId,
      p_status: "confirmed",
      p_rejection_reason: null,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "42501" ? 403 : 422 }
      );
    }

    return NextResponse.json({ ok: true, message: "ยืนยันการชำระเงินเรียบร้อยแล้ว ยอดหนี้ถูกปรับลดแล้ว" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
