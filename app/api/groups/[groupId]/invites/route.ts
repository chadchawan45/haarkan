import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  expiresAt: z.string().datetime().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "วันหมดอายุไม่ถูกต้อง" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("create_group_invite", {
      p_group_id: groupId,
      p_expires_at: parsed.data.expiresAt ?? undefined,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "42501" ? 403 : 422 }
      );
    }

    return NextResponse.json({ token: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "เกิดข้อผิดพลาดในการสร้างคำเชิญ" },
      { status: 500 }
    );
  }
}
