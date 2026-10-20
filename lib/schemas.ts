import { z } from "zod";

const satang = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const participant = z.object({ memberId: z.string().uuid(), amountSatang: z.number().int().nonnegative(), weight: z.number().int().positive().optional() });
export const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(160), expenseDate: z.string().date(), totalAmountSatang: satang,
  splitMode: z.enum(["equal", "custom", "weighted"]), note: z.string().trim().max(2_000).optional(),
  payers: z.array(participant.extend({ amountSatang: satang })).min(1), shares: z.array(participant).min(1),
}).superRefine((value, ctx) => {
  if (value.payers.reduce((sum, row) => sum + row.amountSatang, 0) !== value.totalAmountSatang) ctx.addIssue({ code: "custom", path: ["payers"], message: "ยอดผู้จ่ายต้องรวมเท่ากับยอดรายจ่าย" });
  if (value.splitMode === "custom" && value.shares.reduce((sum, row) => sum + row.amountSatang, 0) !== value.totalAmountSatang) ctx.addIssue({ code: "custom", path: ["shares"], message: "ส่วนแบ่งต้องรวมเท่ากับยอดรายจ่าย" });
  if (value.splitMode === "weighted" && value.shares.some(row => !row.weight)) ctx.addIssue({ code: "custom", path: ["shares"], message: "ต้องระบุน้ำหนักของทุกคน" });
});
export const createPaymentSchema = z.object({ fromMemberId: z.string().uuid(), toMemberId: z.string().uuid(), amountSatang: satang, paymentDate: z.string().date(), settlementMode: z.enum(["direct", "optimized", "manual"]) }).refine(v => v.fromMemberId !== v.toMemberId, { message: "ผู้จ่ายและผู้รับเงินต้องต่างกัน" });
