import crypto from "crypto";

export function isLineConfigured(): boolean {
  return Boolean(process.env.LINE_CHANNEL_SECRET && process.env.LINE_CHANNEL_ACCESS_TOKEN);
}

/**
 * ตรวจสอบความถูกต้องของ LINE Webhook Signature ด้วย HMAC-SHA256
 */
export function verifyLineSignature(body: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;

  const hash = crypto.createHmac("sha256", secret).update(body).digest("base64");
  const hashBuf = Buffer.from(hash);
  const sigBuf = Buffer.from(signature);
  if (hashBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, sigBuf);
}

/**
 * ส่งข้อความแจ้งเตือนผ่าน LINE Messaging API อย่างปลอดภัย
 * หากไม่มี Credentials จะทำการ graceful fallback โดยไม่ส่งและไม่แจ้งเท็จ
 */
export async function sendLineMessage(lineUserId: string, text: string): Promise<{ sent: boolean; reason?: string }> {
  if (!isLineConfigured()) {
    return {
      sent: false,
      reason: "LINE integration is disabled because LINE credentials are not configured",
    };
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { sent: false, reason: `LINE API error: ${err}` };
    }

    return { sent: true };
  } catch (error: any) {
    return { sent: false, reason: error.message ?? "Network error connecting to LINE API" };
  }
}
