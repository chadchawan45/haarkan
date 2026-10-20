import { NextRequest, NextResponse } from "next/server";
import { createPaymentSchema } from "@/lib/schemas";
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

    // ตรวจสอบสิทธิ์สมาชิก
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

    const status = request.nextUrl.searchParams.get("status"); // pending_proof, submitted, confirmed, rejected, all

    let query = supabase
      .from("payments")
      .select(
        `
        id,
        amount_satang,
        payment_date,
        status,
        settlement_mode,
        confirmed_at,
        rejection_reason,
        created_at,
        from_member:group_members!payments_from_member_id_fkey(
          id, user_id, profiles(display_name)
        ),
        to_member:group_members!payments_to_member_id_fkey(
          id, user_id, profiles(display_name)
        ),
        payment_proofs(
          id, storage_path, original_filename, mime_type, size_bytes, created_at
        )
      `
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: payments, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const items = (payments ?? []).map((p: any) => ({
      id: p.id,
      amountSatang: p.amount_satang,
      paymentDate: p.payment_date,
      status: p.status,
      settlementMode: p.settlement_mode,
      confirmedAt: p.confirmed_at,
      rejectionReason: p.rejection_reason,
      createdAt: p.created_at,
      fromMemberId: p.from_member?.id,
      fromDisplayName: p.from_member?.profiles?.display_name ?? "ผู้จ่าย",
      toMemberId: p.to_member?.id,
      toDisplayName: p.to_member?.profiles?.display_name ?? "ผู้รับ",
      hasProof: Boolean(p.payment_proofs && p.payment_proofs.length > 0),
      isPayer: p.from_member?.id === membership.id,
      isRecipient: p.to_member?.id === membership.id,
      canDecide: p.to_member?.id === membership.id || membership.role === "admin",
    }));

    return NextResponse.json({ payments: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const parsed = createPaymentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลการชำระเงินไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const x = parsed.data;
    const { data, error } = await supabase.rpc("create_payment_atomic", {
      p_group_id: groupId,
      p_from_member_id: x.fromMemberId,
      p_to_member_id: x.toMemberId,
      p_amount_satang: x.amountSatang,
      p_payment_date: x.paymentDate,
      p_settlement_mode: x.settlementMode,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "42501" ? 403 : 422 }
      );
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
