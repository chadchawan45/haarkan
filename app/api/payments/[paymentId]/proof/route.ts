import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
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

    const { data: payment } = await supabase
      .from("payments")
      .select("id, group_id, from_member_id, to_member_id")
      .eq("id", paymentId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "ไม่พบรายการชำระเงิน" }, { status: 404 });
    }

    // ตรวจสอบว่าเป็นผู้จ่าย, ผู้รับเงิน, หรือ admin ของกลุ่ม
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("id, role")
      .eq("group_id", payment.group_id)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!myMembership) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const isParticipant =
      myMembership.id === payment.from_member_id ||
      myMembership.id === payment.to_member_id ||
      myMembership.role === "admin";

    if (!isParticipant) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ดูสลิปนี้" }, { status: 403 });
    }

    const { data: proof } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("payment_id", paymentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!proof) {
      return NextResponse.json({ error: "ยังไม่มีการแนบสลิป" }, { status: 404 });
    }

    // สร้าง Signed URL อายุสั้น 15 นาที (900 วินาที)
    const { data: signedData, error } = await supabase.storage
      .from("payment_proofs")
      .createSignedUrl(proof.storage_path, 900);

    return NextResponse.json({
      proof: {
        id: proof.id,
        filename: proof.original_filename,
        mimeType: proof.mime_type,
        sizeBytes: proof.size_bytes,
        signedUrl: signedData?.signedUrl ?? null,
        expiresInSeconds: 900,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
