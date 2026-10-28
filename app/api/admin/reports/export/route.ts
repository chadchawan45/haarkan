import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getAllSharedData, getAllUsersForAdmin } from "@/lib/shared-groups-store";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request, "reports.export");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "users"; // users, groups, expenses

    const store = getAllSharedData();
    let csv = "";
    let filename = "";

    // UTF-8 BOM so Excel handles Thai characters correctly
    const BOM = "\uFEFF";

    if (type === "users") {
      filename = `haarkan_users_${new Date().toISOString().slice(0, 10)}.csv`;
      const users = getAllUsersForAdmin();
      const header = ["ID", "ชื่อ", "ชื่อเล่น", "อีเมล", "เบอร์โทร", "บทบาทระบบ", "สถานะ", "จำนวนกลุ่มที่เข้าร่วม", "ยอดจ่ายรวม (บาท)", "วันที่สร้าง"];
      const rows = users.map((u) => [
        escapeCsv(u.id),
        escapeCsv(u.name),
        escapeCsv(u.nickname || "-"),
        escapeCsv(u.email || "-"),
        escapeCsv(u.phone || "-"),
        escapeCsv(u.systemRole),
        escapeCsv(u.status),
        u.groupsCount,
        (u.totalSpentSatang / 100).toFixed(2),
        escapeCsv(u.createdAt),
      ]);
      csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    } else if (type === "groups") {
      filename = `haarkan_groups_${new Date().toISOString().slice(0, 10)}.csv`;
      const groups = store.groups || [];
      const header = ["ID", "ชื่อกลุ่ม", "คำอธิบาย", "รหัสกลุ่ม (Code)", "ผู้สร้าง", "จำนวนสมาชิก", "วันที่สร้าง"];
      const rows = groups.map((g) => [
        escapeCsv(g.id),
        escapeCsv(g.name),
        escapeCsv(g.description || "-"),
        escapeCsv(g.code),
        escapeCsv(g.creatorMemberId || "-"),
        Array.isArray(g.memberIds) ? g.memberIds.length : (Array.isArray(g.members) ? g.members.length : 0),
        escapeCsv(g.createdAt || "-"),
      ]);
      csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    } else if (type === "expenses") {
      filename = `haarkan_expenses_${new Date().toISOString().slice(0, 10)}.csv`;
      const expenses = store.expenses || [];
      const header = ["ID", "Group ID", "ชื่อรายการ", "วันที่", "ยอดเงิน (บาท)", "หมวดหมู่", "สถานะ", "ผู้บันทึก"];
      const rows = expenses.map((e) => [
        escapeCsv(e.id),
        escapeCsv(e.groupId || "-"),
        escapeCsv(e.title),
        escapeCsv(e.expenseDate),
        ((e.totalAmountSatang || 0) / 100).toFixed(2),
        escapeCsv(e.categoryName || "-"),
        escapeCsv(e.status),
        escapeCsv(e.createdByMemberId || "-"),
      ]);
      csv = BOM + [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    } else {
      return NextResponse.json({ success: false, message: "ประเภทรายงานไม่ถูกต้อง" }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "เกิดข้อผิดพลาดในการส่งออกรายงาน" },
      { status: 500 }
    );
  }
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}
