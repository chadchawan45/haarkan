import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uploadUrlSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024), // สูงสุด 10MB
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await context.params;
    const body = await request.json();
    const parsed = uploadUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ไฟล์ต้องเป็น JPG, PNG หรือ PDF ขนาดไม่เกิน 10MB" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // ตรวจสอบ payment และสิทธิ์ผู้จ่าย
    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .select("id, group_id, from_member_id, status")
      .eq("id", paymentId)
      .single();

    if (pErr || !payment) {
      return NextResponse.json({ error: "ไม่พบรายการชำระเงิน" }, { status: 404 });
    }

    // ตรวจสอบว่าผู้เรียกคือผู้จ่ายเงินในรายการนี้
    const { data: member } = await supabase
      .from("group_members")
      .select("id")
      .eq("id", payment.from_member_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "เฉพาะผู้จ่ายเงินเท่านั้นที่สามารถอัปโหลดสลิปได้" }, { status: 403 });
    }

    // สร้าง path ใน private bucket: receipts/{groupId}/{paymentId}/{randomId}.ext
    const ext = parsed.data.mimeType === "application/pdf" ? "pdf" : parsed.data.mimeType === "image/png" ? "png" : "jpg";
    const storagePath = `receipts/${payment.group_id}/${paymentId}/${crypto.randomUUID()}.${ext}`;

    // สร้าง Signed Upload URL จาก Supabase Storage (private bucket 'payment_proofs')
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("payment_proofs")
      .createSignedUploadUrl(storagePath);

    if (uploadErr) {
      // หากยังไม่ได้สร้าง bucket ให้ fallback คืน path ให้ client รับทราบ
      return NextResponse.json({
        storagePath,
        signedUrl: null,
        message: "Storage bucket payment_proofs needs to be provisioned in Supabase",
      });
    }

    // บันทึก metadata ลงใน payment_proofs table
    await supabase.from("payment_proofs").insert({
      payment_id: paymentId,
      storage_path: storagePath,
      original_filename: parsed.data.filename,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
      uploaded_by: user.id,
    });

    return NextResponse.json({
      storagePath,
      signedUrl: uploadData.signedUrl,
      token: uploadData.token,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
