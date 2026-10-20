import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const rejectSchema = z.object({
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผลในการปฏิเสธ").max(500),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await context.params;
    const body = await request.json();
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ต้องระบุเหตุผลในการปฏิเสธ", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { error } = await supabase.rpc("decide_payment", {
      p_payment_id: paymentId,
      p_status: "rejected",
      p_rejection_reason: parsed.data.reason,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "42501" ? 403 : 422 }
      );
    }

    return NextResponse.json({ ok: true, message: "ปฏิเสธรายการชำระเงินแล้ว" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
