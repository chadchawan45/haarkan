"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGroup, PaymentRecord } from "@/lib/group-context";
import { formatTHB } from "@/lib/money";
import { Navbar } from "@/components/Navbar";
import { PaymentModal } from "@/components/PaymentModal";
import { ProofModal } from "@/components/ProofModal";

export default function BalancesPage() {
  const {
    members,
    currentMemberId,
    currentMember,
    isAdmin,
    netBalances,
    directSettlementList,
    optimizedSettlementList,
    payments,
    isDemo,
    triggerDemoLock,
  } = useGroup();

  const [settlementMode, setSettlementMode] = useState<"optimized" | "direct">("optimized");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPreset, setPaymentPreset] = useState<{ toId: string; amount: number } | null>(null);
  const [selectedProofPayment, setSelectedProofPayment] = useState<PaymentRecord | null>(null);

  const activeSettlements =
    settlementMode === "optimized" ? optimizedSettlementList : directSettlementList;

  // ตรวจสอบว่าผลรวม Net Balance ของทุกคนเป็น 0 หรือไม่
  const totalNetSatang = Array.from(netBalances.values()).reduce((sum, v) => sum + v, 0);

  const handleOpenPay = (toId: string, amountSatang: number) => {
    if (isDemo) {
      triggerDemoLock("การโอนเงินชำระหนี้");
      return;
    }
    setPaymentPreset({ toId, amount: amountSatang });
    setPaymentModalOpen(true);
  };

  return (
    <main className="shell">
      <Navbar />

      {isDemo && (
        <div
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "2px solid #f59e0b",
            color: "#92400e",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "18px" }}>🔒</span>
              <strong style={{ fontSize: "15px" }}>
                ฟังก์ชันการชำระเงินและเคลียร์หนี้ถูกล็อกในโหมดทดลองใช้งาน (Demo Mode)
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#78350f" }}>
              คุณสามารถดูตัวอย่างการคำนวณยอดสุทธิ (Net Balance) และการจับคู่หนี้แบบลดเส้นทาง (Optimized Settlement) ได้
              แต่ไม่สามารถบันทึกการโอนเงินหรือตรวจสลิปได้ (เปิดให้ทดลองเฉพาะ &quot;＋ เพิ่มรายจ่าย&quot;)
            </p>
          </div>
          <Link
            href="/expenses/new"
            className="primary"
            style={{ fontWeight: 700, padding: "8px 16px", textDecoration: "none" }}
          >
            ＋ ไปหน้าเพิ่มรายจ่าย
          </Link>
        </div>
      )}

      <section className="intro">
        <div>
          <p className="eyebrow">ยอดหนี้สุทธิและการชำระเงิน</p>
          <h1>ยอดคงเหลือ & การชำระเงิน</h1>
        </div>

        <button
          className={isDemo ? "secondary" : "primary"}
          style={isDemo ? { borderColor: "#f59e0b", color: "#92400e" } : undefined}
          onClick={() => {
            if (isDemo) {
              triggerDemoLock("การแจ้งชำระเงินและแนบสลิป");
              return;
            }
            setPaymentPreset(null);
            setPaymentModalOpen(true);
          }}
        >
          {isDemo ? "🔒 แจ้งชำระเงิน (ล็อกในเดโม)" : "＋ แจ้งชำระเงิน / แนบสลิป"}
        </button>
      </section>

      {/* สรุป Net Balance ของสมาชิกทุกคน */}
      <section className="card" style={{ marginBottom: "24px" }}>
        <div className="section-title">
          <span>ยอดสุทธิของสมาชิกทุกคน (Net Balances)</span>
          <small style={{ color: totalNetSatang === 0 ? "#168a5f" : "#cf4f36", fontWeight: 600 }}>
            {totalNetSatang === 0 ? "✓ ผลรวมสุทธิทุกคนเท่ากับ ฿0.00 พอดี" : `⚠️ ผลรวมไม่สมดุล (${formatTHB(totalNetSatang)})`}
          </small>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {members.map((m) => {
            const balance = netBalances.get(m.id) ?? 0;
            const isMe = m.id === currentMemberId;
            return (
              <div
                key={m.id}
                style={{
                  background: isMe ? "#f0f8f4" : "#fbfcfb",
                  border: isMe ? "2px solid #1f6f53" : "1px solid #e6eae6",
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{m.name} {isMe && "(คุณ)"}</strong>
                  <span className="badge" style={{ background: m.status === "active" ? "#e7f4ed" : "#f0f0f0", color: m.status === "active" ? "#1f6f53" : "#888" }}>
                    {m.status === "active" ? "ใช้งาน" : "ปิดชั่วคราว"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    margin: "10px 0 4px",
                    color: balance > 0 ? "#168a5f" : balance < 0 ? "#cf4f36" : "#6a766e",
                  }}
                >
                  {balance > 0 ? `+${formatTHB(balance)}` : formatTHB(balance)}
                </div>

                <div style={{ fontSize: "11px", color: "#777" }}>
                  {balance > 0 ? "🟢 ควรได้รับเงินคืน" : balance < 0 ? "🔴 ต้องชำระเงิน" : "⚪ ไม่มีหนี้คงค้าง"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ข้อเสนอ Settlement: Direct vs Optimized */}
      <section className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px" }}>ใครควรจ่ายใคร (Settlement Suggestions)</h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>
              ข้อเสนอคำนวณจากยอดปัจจุบัน และจะเปลี่ยนเมื่อมีการบันทึกรายจ่ายหรือยืนยันสลิป
            </p>
          </div>

          {/* Tab switcher: Optimized vs Direct */}
          <div className="tab-pills" style={{ margin: 0, width: "320px" }}>
            <button
              className={`tab-pill ${settlementMode === "optimized" ? "active" : ""}`}
              onClick={() => setSettlementMode("optimized")}
            >
              ⚡ ลดเส้นทาง (Optimized)
            </button>
            <button
              className={`tab-pill ${settlementMode === "direct" ? "active" : ""}`}
              onClick={() => setSettlementMode("direct")}
            >
              🔍 ตามผู้จ่ายจริง (Direct)
            </button>
          </div>
        </div>

        {activeSettlements.length === 0 ? (
          <div className="empty-state">🎉 ยอดคงเหลือทุกคนเคลียร์หมดแล้ว ไม่มีรายการที่ต้องโอน!</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {activeSettlements.map((s, idx) => {
              const fromM = members.find((m) => m.id === s.fromMemberId);
              const toM = members.find((m) => m.id === s.toMemberId);
              const isMyDebtor = s.fromMemberId === currentMemberId;
              const isMyCreditor = s.toMemberId === currentMemberId;

              return (
                <div
                  key={idx}
                  style={{
                    background: isMyDebtor ? "#fdf8f7" : isMyCreditor ? "#f4faf6" : "#fff",
                    border: isMyDebtor ? "1px solid #f3c2bc" : isMyCreditor ? "1px solid #c9ebd8" : "1px solid #e6eae6",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, color: isMyDebtor ? "#cf4f36" : "#18231e" }}>
                        {fromM?.nickname ? `${fromM.nickname} (${fromM.name})` : fromM?.name}
                      </span>
                      <span style={{ color: "#888" }}>➔</span>
                      <span style={{ fontWeight: 700, color: isMyCreditor ? "#168a5f" : "#18231e" }}>
                        {toM?.nickname ? `${toM.nickname} (${toM.name})` : toM?.name}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#1f6f53", margin: "8px 0" }}>
                    {formatTHB(s.amountSatang)}
                  </div>

                  {/* แสดงข้อมูลรับเงินแบบย่อของผู้รับ */}
                  {toM && (toM.bankAccountNumber || toM.promptpayNumber) && (
                    <div style={{ fontSize: "11px", color: "#555", background: "#f0f8f4", padding: "6px 10px", borderRadius: "8px", margin: "0 0 10px" }}>
                      {toM.bankAccountNumber && <div>💳 {toM.bankName}: <span style={{ fontFamily: "monospace" }}>{toM.bankAccountNumber}</span></div>}
                      {toM.promptpayNumber && <div>📱 พร้อมเพย์: <span style={{ fontFamily: "monospace" }}>{toM.promptpayNumber}</span></div>}
                    </div>
                  )}

                  <p style={{ fontSize: "11px", color: "#777", margin: "0 0 12px" }}>
                    {settlementMode === "optimized"
                      ? "คำนวณจับคู่หนี้สุทธิเพื่อลดจำนวนการโอนรวม"
                      : "ชำระคืนตามรายจ่ายที่ผู้สำรองจ่ายออกไปจริง"}
                  </p>

                  {isMyDebtor ? (
                    <button
                      className={isDemo ? "secondary" : "primary"}
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        fontSize: "13px",
                        padding: "8px",
                        ...(isDemo ? { borderColor: "#f59e0b", color: "#92400e" } : {}),
                      }}
                      onClick={() => handleOpenPay(s.toMemberId, s.amountSatang)}
                    >
                      {isDemo ? `🔒 แจ้งโอนเงิน ${formatTHB(s.amountSatang)}` : `💳 แจ้งโอนเงิน ${formatTHB(s.amountSatang)}`}
                    </button>
                  ) : (
                    <div style={{ fontSize: "12px", color: "#888", textAlign: "center" }}>
                      {isMyCreditor ? "รอยอดโอนเข้าจากสมาชิก" : "รายการระหว่างสมาชิกคนอื่น"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ประวัติการชำระเงินและสลิป (Payment Lifecycle) */}
      <section className="card">
        <div className="section-title">
          <span>ประวัติการชำระเงินและสลิป (Payments History)</span>
          <small>สลิปที่ยืนยันแล้วเท่านั้นจึงจะถือเป็นการลดหนี้อย่างสมบูรณ์</small>
        </div>

        {payments.length === 0 ? (
          <div className="empty-state">ยังไม่มีประวัติการชำระเงิน</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {payments.map((p) => {
              const fromM = members.find((m) => m.id === p.fromMemberId);
              const toM = members.find((m) => m.id === p.toMemberId);
              const isRecipient = p.toMemberId === currentMemberId;
              const canReview = (isRecipient || isAdmin) && p.status === "submitted";

              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#fcfdfc",
                    border: "1px solid #eef0ed",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong>{fromM?.name} ➔ {toM?.name}</strong>
                      <span className={`badge badge-${p.status}`}>
                        {p.status === "confirmed"
                          ? "✓ ยืนยันแล้ว (ลดหนี้แล้ว)"
                          : p.status === "submitted"
                          ? "⏳ รอการตรวจสอบ"
                          : p.status === "rejected"
                          ? "✕ ถูกปฏิเสธ"
                          : "รอยื่นสลิป"}
                      </span>
                    </div>

                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>
                      วันที่แจ้ง: {p.paymentDate} · {p.proof ? `แนบสลิปแล้ว (${p.proof.filename})` : "ยังไม่แนบสลิป"}
                    </p>

                    {p.rejectionReason && (
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#c0392b" }}>
                        เหตุผลที่ปฏิเสธ: {p.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "16px", color: p.status === "confirmed" ? "#168a5f" : "#18231e" }}>
                        {formatTHB(p.amountSatang)}
                      </strong>
                    </div>

                    {p.proof && (
                      <button
                        className="outline"
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                        onClick={() => setSelectedProofPayment(p)}
                      >
                        {canReview ? "🔍 ตรวจสลิป" : "👁️ ดูสลิป"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultRecipientId={paymentPreset?.toId}
        defaultAmountSatang={paymentPreset?.amount}
        settlementMode={settlementMode}
      />

      <ProofModal
        payment={selectedProofPayment}
        onClose={() => setSelectedProofPayment(null)}
      />
    </main>
  );
}
