import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getAllSharedData,
  deleteGroupByAdmin,
  addSystemAuditLog,
} from "@/lib/shared-groups-store";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request, "groups.read");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const store = getAllSharedData();
    const groups = store.groups || [];
    const members = store.members || [];
    const expenses = store.expenses || [];
    const payments = store.payments || [];

    let result = groups.map((g) => {
      const creator = members.find((m) => m.id === g.creatorMemberId);
      const groupExpenses = expenses.filter((e) => e.groupId === g.id);
      const groupPayments = payments.filter((p) => p.groupId === g.id);
      const totalExpenseSatang = groupExpenses.reduce((sum, e) => sum + (e.totalAmountSatang || 0), 0);
      const memberCount = Array.isArray(g.memberIds)
        ? g.memberIds.length
        : Array.isArray(g.members)
        ? g.members.length
        : 0;

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        code: g.code,
        creatorMemberId: g.creatorMemberId,
        creatorName: creator?.name || "ไม่ระบุ",
        defaultCurrency: g.defaultCurrency,
        createdAt: g.createdAt || "2026-01-01T00:00:00.000Z",
        memberCount,
        expensesCount: groupExpenses.length,
        paymentsCount: groupPayments.length,
        totalExpenseSatang,
      };
    });

    if (q) {
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.code.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.creatorName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      groups: result,
      total: result.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่ม" },
      { status: 500 }
    );
  }
}

const deleteSchema = z.object({
  groupId: z.string().min(1, "กรุณาระบุ ID กลุ่ม"),
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผลในการลบกลุ่ม"),
});

export async function DELETE(request: NextRequest) {
  const auth = requireAdminAuth(request, "groups.write");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { groupId, reason } = parsed.data;
    const result = deleteGroupByAdmin(groupId, reason);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    addSystemAuditLog({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      action: "group.delete",
      targetType: "group",
      targetId: groupId,
      details: { reason },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการลบกลุ่ม" },
      { status: 500 }
    );
  }
}
