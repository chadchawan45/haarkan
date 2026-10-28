import { NextRequest, NextResponse } from "next/server";
import { syncClientData, getAllSharedData } from "@/lib/shared-groups-store";

export async function GET() {
  try {
    const store = getAllSharedData();
    return NextResponse.json({
      success: true,
      groups: store.groups,
      members: store.members,
      expenses: store.expenses,
      payments: store.payments,
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
    const body = await request.json();
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
