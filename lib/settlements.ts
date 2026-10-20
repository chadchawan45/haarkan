export type Expense = { status:"active"|"voided"; payers:{memberId:string;amountSatang:number}[]; shares:{memberId:string;amountSatang:number}[] };
export type Payment = { status:"pending_proof"|"submitted"|"confirmed"|"rejected"|"cancelled"; fromMemberId:string;toMemberId:string;amountSatang:number };
export type Settlement = {fromMemberId:string;toMemberId:string;amountSatang:number};
export function balances(expenses:Expense[],payments:Payment[]){const b=new Map<string,number>();const add=(id:string,n:number)=>b.set(id,(b.get(id)??0)+n);for(const e of expenses)if(e.status==='active'){e.payers.forEach(p=>add(p.memberId,p.amountSatang));e.shares.forEach(s=>add(s.memberId,-s.amountSatang));}for(const p of payments)if(p.status==='confirmed'){add(p.fromMemberId,p.amountSatang);add(p.toMemberId,-p.amountSatang);}return b;}
export function optimizedSettlements(balance:Map<string,number>):Settlement[]{const debtors=[...balance].filter(([,v])=>v<0).map(([id,v])=>({id,amount:-v})).sort((a,b)=>a.id.localeCompare(b.id));const creditors=[...balance].filter(([,v])=>v>0).map(([id,amount])=>({id,amount})).sort((a,b)=>a.id.localeCompare(b.id));const result:Settlement[]=[];let d=0,c=0;while(d<debtors.length&&c<creditors.length){const amountSatang=Math.min(debtors[d].amount,creditors[c].amount);result.push({fromMemberId:debtors[d].id,toMemberId:creditors[c].id,amountSatang});debtors[d].amount-=amountSatang;creditors[c].amount-=amountSatang;if(!debtors[d].amount)d++;if(!creditors[c].amount)c++;}return result;}
export function directSettlements(expenses: Expense[]): Settlement[] {
  const out: Settlement[] = [];
  for (const e of expenses) {
    if (e.status !== "active") continue;

    const memberIds = Array.from(
      new Set([...e.payers.map((p) => p.memberId), ...e.shares.map((s) => s.memberId)])
    ).sort((a, b) => a.localeCompare(b));

    const paidMap = new Map(e.payers.map((p) => [p.memberId, p.amountSatang]));
    const shareMap = new Map(e.shares.map((s) => [s.memberId, s.amountSatang]));

    const netPayers: { memberId: string; amountSatang: number }[] = [];
    const netDebtors: { memberId: string; amountSatang: number }[] = [];

    for (const id of memberIds) {
      const diff = (paidMap.get(id) ?? 0) - (shareMap.get(id) ?? 0);
      if (diff > 0) {
        netPayers.push({ memberId: id, amountSatang: diff });
      } else if (diff < 0) {
        netDebtors.push({ memberId: id, amountSatang: -diff });
      }
    }

    let p = 0;
    let d = 0;
    while (p < netPayers.length && d < netDebtors.length) {
      const settleAmount = Math.min(netPayers[p].amountSatang, netDebtors[d].amountSatang);
      if (settleAmount > 0) {
        out.push({
          fromMemberId: netDebtors[d].memberId,
          toMemberId: netPayers[p].memberId,
          amountSatang: settleAmount,
        });
      }
      netPayers[p].amountSatang -= settleAmount;
      netDebtors[d].amountSatang -= settleAmount;
      if (!netPayers[p].amountSatang) p++;
      if (!netDebtors[d].amountSatang) d++;
    }
  }
  return out;
}

