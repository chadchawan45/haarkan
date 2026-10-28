import { NextRequest, NextResponse } from "next/server";
import { syncClientData, getAllSharedData } from "@/lib/shared-groups-store";
import { getMemberFromRequest } from "@/lib/user-auth";
import { getAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const member = getMemberFromRequest(request);
    const admin = getAdminFromRequest(request);

    // If neither authenticated member nor admin, reject
    if (!member && !admin) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนซิงค์ข้อมูล (Unauthorized)",
        },
        { status: 401 }
      );
    }

    const store = getAllSharedData();

    // If System Admin, return full store
    if (admin) {
      return NextResponse.json({
        success: true,
        groups: store.groups,
        members: store.members,
        expenses: store.expenses,
        payments: store.payments,
        notifications: store.notifications || [],
      });
    }

    // SCOPED TO AUTHENTICATED MEMBER ONLY
    const userId = member!.id;

    // 1. Groups where user is creator or active member
    const userGroups = (store.groups || []).filter((g) => {
      if (g.creatorMemberId === userId) return true;
      if (Array.isArray(g.memberIds) && g.memberIds.includes(userId)) return true;
      if (Array.isArray(g.members) && g.members.some((m: any) => m.id === userId)) return true;
      return false;
    });

    const userGroupIds = new Set(userGroups.map((g) => g.id));

    // 2. Expenses and payments belonging ONLY to user's groups
    const userExpenses = (store.expenses || []).filter(
      (e) => e.groupId && userGroupIds.has(e.groupId)
    );

    const userPayments = (store.payments || []).filter(
      (p) => p.groupId && userGroupIds.has(p.groupId)
    );

    // 3. Members who share at least one group with this user
    const sharedMemberIds = new Set<string>([userId]);
    for (const g of userGroups) {
      if (g.creatorMemberId) sharedMemberIds.add(g.creatorMemberId);
      if (Array.isArray(g.memberIds)) {
        g.memberIds.forEach((id: string) => sharedMemberIds.add(id));
      }
      if (Array.isArray(g.members)) {
        g.members.forEach((m: any) => sharedMemberIds.add(m.id));
      }
    }

    const scopedMembers = (store.members || [])
      .filter((m) => sharedMemberIds.has(m.id))
      .map(({ password: _, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      groups: userGroups,
      members: scopedMembers,
      expenses: userExpenses,
      payments: userPayments,
      notifications: store.notifications || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const member = getMemberFromRequest(request);
    const admin = getAdminFromRequest(request);

    if (!member && !admin) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนทำการซิงค์ข้อมูล (Unauthorized)",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const store = getAllSharedData();
    const userId = member?.id;

    // Non-admin authorization checks
    if (!admin && userId) {
      // 1. If deleting a group, must be the creator of that group
      if (body.deletedGroupId) {
        const targetGroup = (store.groups || []).find((g) => g.id === body.deletedGroupId);
        if (targetGroup && targetGroup.creatorMemberId !== userId) {
          return NextResponse.json(
            { success: false, message: "คุณไม่มีสิทธิ์ลบกลุ่มนี้ (ต้องเป็นผู้สร้างกลุ่มเท่านั้น)" },
            { status: 403 }
          );
        }
      }

      // 2. If mutating expenses or payments, verify group membership
      if (Array.isArray(body.expenses)) {
        for (const exp of body.expenses) {
          if (exp.groupId) {
            const grp = (store.groups || []).find((g) => g.id === exp.groupId);
            if (grp) {
              const isMember =
                grp.creatorMemberId === userId ||
                grp.memberIds?.includes(userId) ||
                grp.members?.some((m: any) => m.id === userId);
              if (!isMember) {
                return NextResponse.json(
                  { success: false, message: `คุณไม่มีสิทธิ์บันทึกรายจ่ายในกลุ่ม "${grp.name}"` },
                  { status: 403 }
                );
              }
            }
          }
        }
      }
    }

    const updatedStore = syncClientData(body);
    return NextResponse.json({
      success: true,
      message: "Synced successfully",
      groups: updatedStore.groups,
      members: updatedStore.members,
      expenses: updatedStore.expenses,
      payments: updatedStore.payments,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to sync group data" },
      { status: 500 }
    );
  }
}
