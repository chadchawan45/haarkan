import { NextRequest, NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/line";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-line-signature");
    const rawBody = await request.text();

    // หากไม่มีการตั้งค่า Secret หรือ Signature ไม่ถูกต้อง ให้ปฏิเสธทันที
    if (!verifyLineSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const events = payload.events ?? [];

    for (const event of events) {
      // จัดการ event ต่างๆ เช่น follow หรือ message
      if (event.type === "follow") {
        // บันทึก event หรือตอบกลับต้อนรับ
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Webhook error" }, { status: 500 });
  }
}
