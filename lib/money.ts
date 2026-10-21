export type Allocation = {
  memberId: string;
  amountSatang: number;
  weight?: number;
};

export const formatTHB = (satang: number): string =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(satang / 100);

/**
 * Parses display input without ever using decimal floating-point arithmetic.
 * Returns satang integer or null if invalid.
 */
export function parseTHB(input: string): number | null {
  const normalized = input.trim().replace(/,/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;

  const baht = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const result = baht * 100 + fraction;

  return Number.isSafeInteger(result) ? result : null;
}

const validateTotal = (total: number) => {
  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new Error("ยอดรวมต้องเป็นจำนวนสตางค์จำนวนเต็มที่มากกว่า 0");
  }
};

/**
 * หารเท่ากัน (เศษสตางค์แจกจ่ายให้คนแรกๆ ตามลำดับ ID ที่เรียงแล้ว)
 */
export function equalSplit(totalSatang: number, memberIds: string[]): Allocation[] {
  validateTotal(totalSatang);
  if (!memberIds.length) {
    throw new Error("ต้องมีผู้ร่วมรับผิดชอบอย่างน้อยหนึ่งคน");
  }

  const ordered = [...memberIds].sort();
  const base = Math.floor(totalSatang / ordered.length);
  let remainder = totalSatang % ordered.length;

  return ordered.map((memberId) => ({
    memberId,
    amountSatang: base + (remainder-- > 0 ? 1 : 0),
  }));
}

/**
 * ตรวจสอบและจัดสรรส่วนแบ่งแบบกำหนดเอง
 */
export function customSplit(totalSatang: number, shares: Allocation[]): Allocation[] {
  validateTotal(totalSatang);
  if (
    !shares.length ||
    shares.some((s) => !Number.isSafeInteger(s.amountSatang) || s.amountSatang < 0)
  ) {
    throw new Error("ส่วนแบ่งไม่ถูกต้อง");
  }

  const sum = shares.reduce((total, s) => total + s.amountSatang, 0);
  if (sum !== totalSatang) {
    throw new Error("ผลรวมส่วนแบ่งต้องเท่ากับยอดรายจ่าย");
  }

  return shares;
}

/**
 * หารตามสัดส่วนน้ำหนัก (เศษสตางค์ถูกปรับให้ลงตัวกับยอดรวม)
 */
export function weightedSplit(
  totalSatang: number,
  weights: { memberId: string; weight: number }[]
): Allocation[] {
  validateTotal(totalSatang);
  if (!weights.length || weights.some((x) => !Number.isInteger(x.weight) || x.weight <= 0)) {
    throw new Error("น้ำหนักต้องเป็นจำนวนเต็มบวก");
  }

  const totalWeight = weights.reduce((sum, x) => sum + x.weight, 0);
  const ordered = [...weights].sort((a, b) => a.memberId.localeCompare(b.memberId));
  let remaining = totalSatang;

  return ordered.map((x, index) => {
    const amountSatang =
      index === ordered.length - 1
        ? remaining
        : Math.floor((totalSatang * x.weight) / totalWeight);
    remaining -= amountSatang;
    return { ...x, amountSatang };
  });
}
