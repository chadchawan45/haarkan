import type { Expense, Payment } from "@/lib/settlements";
export type GroupMember={id:string;userId:string;displayName:string;status:"active"|"inactive"|"removed"};
export type ExpenseRow={id:string;status:"active"|"voided";expense_payers:{member_id:string;amount_satang:number}[];expense_shares:{member_id:string;amount_satang:number}[]};
export type PaymentRow={status:Payment["status"];from_member_id:string;to_member_id:string;amount_satang:number};
export const toExpenses=(rows:ExpenseRow[]):Expense[]=>rows.map(x=>({status:x.status,payers:x.expense_payers.map(p=>({memberId:p.member_id,amountSatang:p.amount_satang})),shares:x.expense_shares.map(s=>({memberId:s.member_id,amountSatang:s.amount_satang}))}));
export const toPayments=(rows:PaymentRow[]):Payment[]=>rows.map(x=>({status:x.status,fromMemberId:x.from_member_id,toMemberId:x.to_member_id,amountSatang:x.amount_satang}));
