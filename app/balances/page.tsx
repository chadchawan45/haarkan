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
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.05) 100%)",
            border: "1.5px solid var(--warning)",
            color: "var(--text-main)",
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
              <strong style={{ fontSize: "15px", color: "var(--warning)" }}>
                ฟังก์ชันการชำระเงินและเคลียร์หนี้ถูกล็อกในโหมดทดลองใช้งาน (Demo Mode)
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
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
          <p className="eyebrow" style={{ color: "var(--primary)", fontWeight: 700 }}>ยอดหนี้สุทธิและการชำระเงิน</p>
          <h1 style={{ color: "var(--text-main)" }}>ยอดคงเหลือ & การชำระเงิน</h1>
        </div>

        <button
          className={isDemo ? "secondary" : "primary"}
          style={isDemo ? { borderColor: "var(--warning)", color: "var(--warning)" } : undefined}
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
          <small style={{ color: totalNetSatang === 0 ? "var(--primary)" : "var(--danger)", fontWeight: 700 }}>
            {totalNetSatang === 0 ? "✓ ผลรวมสุทธิทุกคนเท่ากับ ฿0.00 พอดี" : `⚠️ ผลรวมไม่สมดุล (${formatTHB(totalNetSatang)})`}
          </small>
        </div>

        <div className="net-balances-grid">
          {members.map((m) => {
            const balance = netBalances.get(m.id) ?? 0;
            const isMe = m.id === currentMemberId;
            return (
              <div
                key={m.id}
                className={`net-balance-card ${isMe ? "is-me" : ""}`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: m.avatarColor,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 700,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        m.name.slice(0, 1)
                      )}
                    </div>
                    <div>
                      <strong style={{ fontSize: "14px", color: "var(--text-main)", display: "block" }}>
                        {m.nickname ? `${m.nickname} (${m.name})` : m.name}
                      </strong>
                      {isMe && (
                        <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>
                          (คุณ)
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className="badge"
                    style={{
                      background: m.status === "active" ? "rgba(39, 174, 96, 0.15)" : "rgba(148, 163, 184, 0.15)",
                      color: m.status === "active" ? "var(--primary)" : "var(--text-muted)",
                      border: m.status === "active" ? "1px solid rgba(39, 174, 96, 0.3)" : "1px solid rgba(148, 163, 184, 0.3)",
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      fontWeight: 600,
                    }}
                  >
                    {m.status === "active" ? "ใช้งาน" : "ปิดชั่วคราว"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    margin: "12px 0 4px",
                    color: balance > 0 ? "var(--primary)" : balance < 0 ? "var(--danger)" : "var(--text-muted)",
                  }}
                >
                  {balance > 0 ? `+${formatTHB(balance)}` : formatTHB(balance)}
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{balance > 0 ? "🟢" : balance < 0 ? "🔴" : "⚪"}</span>
                  <span style={{ fontWeight: 500 }}>
                    {balance > 0 ? "ควรได้รับเงินคืน" : balance < 0 ? "ต้องชำระเงิน" : "ไม่มีหนี้คงค้าง"}
                  </span>
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
            <h3 style={{ margin: 0, fontSize: "17px", color: "var(--text-main)" }}>ใครควรจ่ายใคร (Settlement Suggestions)</h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              ข้อเสนอคำนวณจากยอดปัจจุบัน และจะเปลี่ยนเมื่อมีการบันทึกรายจ่ายหรือยืนยันสลิป
            </p>
          </div>

          {/* Tab switcher: Optimized vs Direct */}
          <div className="tab-pills settlement-mode-tabs">
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
          <div
            style={{
              padding: "36px 16px",
              textAlign: "center",
              background: "rgba(39, 174, 96, 0.05)",
              border: "1px dashed var(--border)",
              borderRadius: "14px",
              color: "var(--text-main)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎉</div>
            <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px", color: "var(--primary)" }}>
              ยอดคงเหลือทุกคนเคลียร์หมดแล้ว
            </strong>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              ไม่มีรายการหนี้ที่ต้องโอนระหว่างกัน
            </span>
          </div>
        ) : (
          <div className="settlement-cards-grid">
            {activeSettlements.map((s, idx) => {
              const fromM = members.find((m) => m.id === s.fromMemberId);
              const toM = members.find((m) => m.id === s.toMemberId);
              const isMyDebtor = s.fromMemberId === currentMemberId;
              const isMyCreditor = s.toMemberId === currentMemberId;

              return (
                <div
                  key={idx}
                  style={{
                    background: isMyDebtor
                      ? "rgba(239, 68, 68, 0.06)"
                      : isMyCreditor
                      ? "rgba(39, 174, 96, 0.08)"
                      : "var(--card-bg)",
                    border: isMyDebtor
                      ? "1px solid rgba(239, 68, 68, 0.3)"
                      : isMyCreditor
                      ? "1px solid rgba(39, 174, 96, 0.35)"
                      : "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, color: isMyDebtor ? "var(--danger)" : "var(--text-main)" }}>
                        {fromM?.nickname ? `${fromM.nickname} (${fromM.name})` : fromM?.name}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>➔</span>
                      <span style={{ fontWeight: 700, color: isMyCreditor ? "var(--primary)" : "var(--text-main)" }}>
                        {toM?.nickname ? `${toM.nickname} (${toM.name})` : toM?.name}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary)", margin: "8px 0" }}>
                    {formatTHB(s.amountSatang)}
                  </div>

                  {/* แสดงข้อมูลรับเงินแบบย่อของผู้รับ */}
                  {toM && (toM.bankAccountNumber || toM.promptpayNumber) && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-main)",
                        background: "rgba(39, 174, 96, 0.08)",
                        border: "1px solid rgba(39, 174, 96, 0.2)",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        margin: "0 0 10px",
                      }}
                    >
                      {toM.bankAccountNumber && (
                        <div>💳 {toM.bankName}: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{toM.bankAccountNumber}</span></div>
                      )}
                      {toM.promptpayNumber && (
                        <div style={{ marginTop: toM.bankAccountNumber ? "4px" : "0" }}>
                          📱 พร้อมเพย์: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{toM.promptpayNumber}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 12px" }}>
                    {settlementMode === "optimized"
                      ? "⚡ คำนวณจับคู่หนี้สุทธิเพื่อลดจำนวนการโอนรวม"
                      : "🔍 ชำระคืนตามรายจ่ายที่ผู้สำรองจ่ายออกไปจริง"}
                  </p>

                  {isMyDebtor ? (
                    <button
                      className={isDemo ? "secondary" : "primary"}
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        fontSize: "13px",
                        padding: "8px",
                        ...(isDemo ? { borderColor: "var(--warning)", color: "var(--warning)" } : {}),
                      }}
                      onClick={() => handleOpenPay(s.toMemberId, s.amountSatang)}
                    >
                      {isDemo ? `🔒 แจ้งโอนเงิน ${formatTHB(s.amountSatang)}` : `💳 แจ้งโอนเงิน ${formatTHB(s.amountSatang)}`}
                    </button>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "6px" }}>
                      {isMyCreditor ? "⏳ รอยอดโอนเข้าจากสมาชิก" : "รายการระหว่างสมาชิกคนอื่น"}
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
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              background: "rgba(148, 163, 184, 0.04)",
              border: "1px dashed var(--border)",
              borderRadius: "14px",
              color: "var(--text-muted)",
              fontSize: "14px",
            }}
          >
            📄 ยังไม่มีประวัติการชำระเงิน
          </div>
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
                    padding: "14px 16px",
                    borderRadius: "12px",
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "var(--text-main)" }}>{fromM?.name} ➔ {toM?.name}</strong>
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

                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                      วันที่แจ้ง: {p.paymentDate} · {p.proof ? `แนบสลิปแล้ว (${p.proof.filename})` : "ยังไม่แนบสลิป"}
                    </p>

                    {p.rejectionReason && (
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--danger)" }}>
                        เหตุผลที่ปฏิเสธ: {p.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "16px", color: p.status === "confirmed" ? "var(--primary)" : "var(--text-main)" }}>
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
