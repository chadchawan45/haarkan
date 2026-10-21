import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
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

    const { data: payment } = await supabase
      .from("payments")
      .select("id, group_id, from_member_id, to_member_id, status")
      .eq("id", paymentId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "ไม่พบรายการชำระเงิน" }, { status: 404 });
    }

    // ตรวจสอบว่าผู้เรียกเป็นผู้จ่าย
    const { data: fromMember } = await supabase
      .from("group_members")
      .select("id")
      .eq("id", payment.from_member_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!fromMember) {
      return NextResponse.json({ error: "เฉพาะผู้จ่ายเงินเท่านั้นที่สามารถส่งตรวจสลิปได้" }, { status: 403 });
    }

    // ตรวจสอบว่าสถานะปัจจุบันอนุญาตให้ submit ได้
    if (payment.status !== "pending_proof" && payment.status !== "rejected") {
      return NextResponse.json(
        { error: "ไม่สามารถส่งสลิปได้ในสถานะนี้ (สถานะปัจจุบัน: " + payment.status + ")" },
        { status: 422 }
      );
    }

    // ตรวจสอบว่ามีหลักฐานสลิปแนบอยู่ หรือส่งมาพร้อมคำขอนี้
    const body = await request.json().catch(() => null);
    if (body && body.storagePath && body.filename && body.mimeType && body.sizeBytes) {
      await supabase.from("payment_proofs").insert({
        payment_id: paymentId,
        storage_path: body.storagePath,
        original_filename: body.filename,
        mime_type: body.mimeType,
        size_bytes: body.sizeBytes,
        uploaded_by: user.id,
      });
    }

    const { data: proof } = await supabase
      .from("payment_proofs")
      .select("id")
      .eq("payment_id", paymentId)
      .limit(1)
      .maybeSingle();

    if (!proof) {
      return NextResponse.json(
        { error: "กรุณาแนบสลิปหลักฐานการชำระเงินก่อนส่งตรวจ" },
        { status: 422 }
      );
    }

    // ปรับสถานะเป็น submitted
    const { error } = await supabase
      .from("payments")
      .update({ status: "submitted" })
      .eq("id", paymentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    // แจ้งเตือนผู้รับเงิน
    const { data: toMember } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("id", payment.to_member_id)
      .single();

    if (toMember) {
      await supabase.from("notifications").insert({
        user_id: toMember.user_id,
        group_id: payment.group_id,
        type: "payment_submitted",
        title: "มีสลิปการชำระเงินใหม่",
        body: "สมาชิกได้แนบสลิปและส่งให้คุณตรวจสอบแล้ว",
        data: { payment_id: paymentId },
      });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      group_id: payment.group_id,
      actor_user_id: user.id,
      entity_type: "payment",
      entity_id: paymentId,
      action: "submitted",
    });

    return NextResponse.json({ ok: true, message: "ส่งสลิปเพื่อรอการตรวจสอบเรียบร้อยแล้ว" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
