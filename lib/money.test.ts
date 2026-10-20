import { describe, it, expect } from "vitest";
import { customSplit, equalSplit, parseTHB, formatTHB, weightedSplit } from "./money";
import { balances, optimizedSettlements, directSettlements, type Expense, type Payment } from "./settlements";
import { endOfWeek, startOfWeek } from "./periods";

describe("Allocation & Money Utilities", () => {
  it("แปลงเงินบาทเป็นสตางค์โดยไม่คำนวณ float", () => {
    expect(parseTHB("1,234.56")).toBe(123456);
    expect(parseTHB("0")).toBe(0);
    expect(parseTHB("100")).toBe(10000);
    expect(parseTHB("0.05")).toBe(5);
    expect(parseTHB("-50")).toBeNull();
    expect(parseTHB("abc")).toBeNull();
  });

  it("formatTHB แสดงผลเป็นเงินบาทอย่างถูกต้อง", () => {
    const formatted = formatTHB(123456);
    expect(formatted).toContain("1,234.56");
  });

  it("equal split ที่หารลงตัว แบ่งเท่ากันทุกคน", () => {
    const result = equalSplit(9000, ["alice", "bob", "charlie"]);
    expect(result).toEqual([
      { memberId: "alice", amountSatang: 3000 },
      { memberId: "bob", amountSatang: 3000 },
      { memberId: "charlie", amountSatang: 3000 },
    ]);
    expect(result.reduce((sum, r) => sum + r.amountSatang, 0)).toBe(9000);
  });

  it("equal split ที่มีเศษสตางค์ กระจายเศษตามลำดับชื่อ/id ที่เสถียร", () => {
    const result = equalSplit(100, ["c", "a", "b"]);
    expect(result).toEqual([
      { memberId: "a", amountSatang: 34 },
      { memberId: "b", amountSatang: 33 },
      { memberId: "c", amountSatang: 33 },
    ]);
    expect(result.reduce((sum, r) => sum + r.amountSatang, 0)).toBe(100);
  });

  it("custom split ที่ผลรวมตรงยอด ต้องผ่านและเก็บยอดเดิม", () => {
    const shares = [
      { memberId: "a", amountSatang: 4000 },
      { memberId: "b", amountSatang: 6000 },
    ];
    const result = customSplit(10000, shares);
    expect(result).toEqual(shares);
  });

  it("custom split ที่ผลรวมไม่ตรงยอด ต้องถูกปฏิเสธ (ทั้งยอดขาดและเกิน)", () => {
    expect(() =>
      customSplit(10000, [
        { memberId: "a", amountSatang: 4000 },
        { memberId: "b", amountSatang: 5000 },
      ])
    ).toThrow("ผลรวมส่วนแบ่งต้องเท่ากับยอดรายจ่าย");

    expect(() =>
      customSplit(10000, [
        { memberId: "a", amountSatang: 6000 },
        { memberId: "b", amountSatang: 6000 },
      ])
    ).toThrow("ผลรวมส่วนแบ่งต้องเท่ากับยอดรายจ่าย");
  });

  it("weighted split หลายน้ำหนัก กระจายเศษให้ผลรวมตรงยอดเป๊ะเสมอ", () => {
    // 101 satang แบ่ง 1:2
    const res1 = weightedSplit(101, [
      { memberId: "a", weight: 1 },
      { memberId: "b", weight: 2 },
    ]);
    expect(res1.reduce((sum, x) => sum + x.amountSatang, 0)).toBe(101);
    expect(res1[0].amountSatang).toBe(33); // 101 * 1/3 = 33
    expect(res1[1].amountSatang).toBe(68); // 101 - 33 = 68

    // 1000 satang แบ่ง 1:2:3
    const res2 = weightedSplit(1000, [
      { memberId: "a", weight: 1 },
      { memberId: "b", weight: 2 },
      { memberId: "c", weight: 3 },
    ]);
    expect(res2.reduce((sum, x) => sum + x.amountSatang, 0)).toBe(1000);
  });

  it("weighted split ปฏิเสธค่าน้ำหนักที่เป็นลบหรือศูนย์", () => {
    expect(() =>
      weightedSplit(1000, [
        { memberId: "a", weight: 0 },
        { memberId: "b", weight: 1 },
      ])
    ).toThrow("น้ำหนักต้องเป็นจำนวนเต็มบวก");
  });
});

describe("Settlements & Net Balances", () => {
  it("net balances รวมกันของสมาชิกทุกคนต้องเท่ากับศูนย์เสมอ", () => {
    const expenses: Expense[] = [
      {
        status: "active",
        payers: [{ memberId: "a", amountSatang: 12000 }],
        shares: [
          { memberId: "a", amountSatang: 4000 },
          { memberId: "b", amountSatang: 4000 },
          { memberId: "c", amountSatang: 4000 },
        ],
      },
      {
        status: "active",
        payers: [
          { memberId: "b", amountSatang: 3000 },
          { memberId: "c", amountSatang: 3000 },
        ],
        shares: [
          { memberId: "a", amountSatang: 2000 },
          { memberId: "b", amountSatang: 2000 },
          { memberId: "c", amountSatang: 2000 },
        ],
      },
    ];

    const currentBalances = balances(expenses, []);
    const sum = Array.from(currentBalances.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBe(0);
  });

  it("confirmed payment เท่านั้นที่ลดหนี้ ส่วน pending/rejected/cancelled ไม่ลดหนี้", () => {
    const expenses: Expense[] = [
      {
        status: "active",
        payers: [{ memberId: "a", amountSatang: 10000 }],
        shares: [
          { memberId: "a", amountSatang: 2000 },
          { memberId: "b", amountSatang: 8000 },
        ],
      },
    ];

    // ก่อนจ่าย: b เป็นหนี้ 8000 (net balance: -8000)
    expect(balances(expenses, []).get("b")).toBe(-8000);

    // pending_proof และ submitted ไม่ลดหนี้
    const pendingPayment: Payment = {
      status: "submitted",
      fromMemberId: "b",
      toMemberId: "a",
      amountSatang: 8000,
    };
    expect(balances(expenses, [pendingPayment]).get("b")).toBe(-8000);

    // rejected ไม่ลดหนี้
    const rejectedPayment: Payment = {
      status: "rejected",
      fromMemberId: "b",
      toMemberId: "a",
      amountSatang: 8000,
    };
    expect(balances(expenses, [rejectedPayment]).get("b")).toBe(-8000);

    // confirmed ลดหนี้เรียบร้อย ยอดเป็น 0
    const confirmedPayment: Payment = {
      status: "confirmed",
      fromMemberId: "b",
      toMemberId: "a",
      amountSatang: 8000,
    };
    expect(balances(expenses, [confirmedPayment]).get("b")).toBe(0);
    expect(balances(expenses, [confirmedPayment]).get("a")).toBe(0);
  });

  it("voided expense ไม่ถูกนำมาคิดใน net balance", () => {
    const expenses: Expense[] = [
      {
        status: "voided",
        payers: [{ memberId: "a", amountSatang: 5000 }],
        shares: [
          { memberId: "a", amountSatang: 2500 },
          { memberId: "b", amountSatang: 2500 },
        ],
      },
    ];

    const b = balances(expenses, []);
    expect(Array.from(b.keys())).toHaveLength(0);
  });

  it("direct settlement คำนวณถูกต้องสำหรับหลาย payer และ debtor", () => {
    const expense: Expense = {
      status: "active",
      payers: [
        { memberId: "a", amountSatang: 6000 },
        { memberId: "b", amountSatang: 4000 },
      ],
      shares: [
        { memberId: "a", amountSatang: 2000 },
        { memberId: "b", amountSatang: 2000 },
        { memberId: "c", amountSatang: 3000 },
        { memberId: "d", amountSatang: 3000 },
      ],
    };

    const direct = directSettlements([expense]);
    expect(direct.length).toBeGreaterThan(0);
    // ตรวจสอบว่ายอดรวมที่จ่ายทั้งหมดตรงกับยอดที่ debtor ต้องชำระ (c=3000, d=3000 รวม 6000)
    const totalSettled = direct.reduce((sum, s) => sum + s.amountSatang, 0);
    expect(totalSettled).toBe(6000);
  });

  it("optimized settlement จับคู่ยอดและทำให้ net balance ของทุกคนกลายเป็นศูนย์", () => {
    // กำหนดกลุ่มที่มี 4 คน net balance: a = +5000, b = +3000, c = -4000, d = -4000
    const b = new Map<string, number>([
      ["a", 5000],
      ["b", 3000],
      ["c", -4000],
      ["d", -4000],
    ]);

    const settlements = optimizedSettlements(b);
    expect(settlements.length).toBeLessThanOrEqual(3); // ทฤษฎี N-1 transactions

    // จำลองการชำระเงินตาม settlements ทั้งหมดว่าทำให้ net balance ทุกคนเป็นศูนย์
    const afterBalance = new Map(b);
    for (const s of settlements) {
      afterBalance.set(s.fromMemberId, (afterBalance.get(s.fromMemberId) ?? 0) + s.amountSatang);
      afterBalance.set(s.toMemberId, (afterBalance.get(s.toMemberId) ?? 0) - s.amountSatang);
    }

    for (const [, balance] of afterBalance) {
      expect(balance).toBe(0);
    }
  });
});

describe("Periods & Week Starts", () => {
  it("คำนวณขอบเขตสัปดาห์ตาม week_starts_on อย่างถูกต้อง", () => {
    // 2026-10-19 คือวันจันทร์ (UTC)
    const monday = new Date("2026-10-19T00:00:00Z");

    // ถ้าเริ่มวันจันทร์ (weekStartsOn = 1) -> สัปดาห์คือ จันทร์ 19 ถึง อาทิตย์ 25
    expect(startOfWeek(monday, 1).toISOString().slice(0, 10)).toBe("2026-10-19");
    expect(endOfWeek(monday, 1).toISOString().slice(0, 10)).toBe("2026-10-25");

    // ถ้าเริ่มวันอาทิตย์ (weekStartsOn = 0) -> วันจันทร์ที่ 19 อยู่ในสัปดาห์ที่เริ่มวันอาทิตย์ที่ 18 ต.ค.
    expect(startOfWeek(monday, 0).toISOString().slice(0, 10)).toBe("2026-10-18");
    expect(endOfWeek(monday, 0).toISOString().slice(0, 10)).toBe("2026-10-24");

    // ถ้าเริ่มวันเสาร์ (weekStartsOn = 6) -> เสาร์ที่ 17 ถึง ศุกร์ที่ 23
    expect(startOfWeek(monday, 6).toISOString().slice(0, 10)).toBe("2026-10-17");
    expect(endOfWeek(monday, 6).toISOString().slice(0, 10)).toBe("2026-10-23");
  });
});
