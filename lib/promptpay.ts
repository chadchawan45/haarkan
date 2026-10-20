import QRCode from "qrcode";

/**
 * Format an EMVCo Tag-Length-Value field.
 */
function formatField(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * Standard CRC16-CCITT implementation for EMVCo QR codes.
 * Polynomial: 0x1021, Initial value: 0xFFFF
 */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Generate PromptPay EMVCo QR payload string.
 * @param target Mobile number (e.g. 0812345678) or National ID (13 digits)
 * @param amountBaht Optional amount in THB (e.g. 17837.66)
 */
export function generatePromptPayPayload(target: string, amountBaht?: number): string {
  const digits = target.replace(/[^0-9]/g, "");
  if (!digits) return "";

  let targetField = "";
  if (
    digits.length === 10 ||
    (digits.length === 9 && digits.startsWith("0")) ||
    (digits.length <= 10 && (digits.startsWith("08") || digits.startsWith("09") || digits.startsWith("06")))
  ) {
    // เบอร์มือถือไทย: เติม 0066 + ตัด 0 ด้านหน้า -> ปรับให้ครบ 13 ตัวอักษร
    const normalizedMobile = "0066" + digits.replace(/^0/, "");
    const padded = normalizedMobile.padStart(13, "0");
    targetField = formatField("01", padded);
  } else if (digits.length === 13) {
    // เลขบัตรประชาชน 13 หลัก
    targetField = formatField("02", digits);
  } else if (digits.length === 15) {
    // e-Wallet ID
    targetField = formatField("03", digits);
  } else {
    // เบอร์โทรทั่วไปหรือค่าที่กรอกมา
    const normalized = digits.startsWith("0") ? "0066" + digits.slice(1) : digits;
    const padded = normalized.padStart(13, "0");
    targetField = formatField("01", padded);
  }

  // Tag 29: ข้อมูล Merchant PromptPay
  const tag29Value = formatField("00", "A000000677010111") + targetField;
  const tag29 = formatField("29", tag29Value);

  // Tag 00: Payload Format Indicator
  const tag00 = formatField("00", "01");

  // Tag 01: 11 = Static (ยอดไม่ระบุ), 12 = Dynamic (มียอดเงินเจาะจง)
  const isDynamic = typeof amountBaht === "number" && amountBaht > 0;
  const tag01 = formatField("01", isDynamic ? "12" : "11");

  // Tag 53: Transaction Currency (764 = THB)
  const tag53 = formatField("53", "764");

  // Tag 54: ยอดเงิน (ทศนิยม 2 ตำแหน่ง)
  let tag54 = "";
  if (isDynamic && amountBaht) {
    const formattedAmount = amountBaht.toFixed(2);
    tag54 = formatField("54", formattedAmount);
  }

  // Tag 58: Country Code (TH)
  const tag58 = formatField("58", "TH");

  const rawPayload = `${tag00}${tag01}${tag29}${tag53}${tag54}${tag58}6304`;
  const checksum = crc16(rawPayload);
  return `${rawPayload}${checksum}`;
}

/**
 * Generate QR code as Base64 Data URL.
 */
export async function generatePromptPayDataUrl(
  target: string,
  amountBaht?: number,
  options?: { width?: number; margin?: number }
): Promise<string> {
  const payload = generatePromptPayPayload(target, amountBaht);
  if (!payload) return "";

  return await QRCode.toDataURL(payload, {
    width: options?.width ?? 280,
    margin: options?.margin ?? 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}
