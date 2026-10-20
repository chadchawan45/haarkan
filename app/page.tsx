"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useGroup, ExpenseRecord, PaymentRecord } from "@/lib/group-context";
import { formatTHB } from "@/lib/money";
import { Navbar } from "@/components/Navbar";
import { LandingPage } from "@/components/LandingPage";
import { PaymentModal } from "@/components/PaymentModal";
import { ProofModal } from "@/components/ProofModal";
import { startOfWeek, endOfWeek } from "@/lib/periods";

const CATEGORY_COLORS: Record<string, string> = {
  "อาหาร": "#f18958",
  "น้ำดื่ม": "#4e9d7b",
  "ของใช้ส่วนกลาง": "#5a98d6",
  "อื่น ๆ": "#d8a4e8",
  "ทั่วไป": "#95c6b0",
};

export default function DashboardPage() {
  const {
    group,
    members,
    expenses,
    payments,
    currentMemberId,
    currentMember,
    isAdmin,
    isGroupCreator,
    isAuthenticated,
    myOwedSatang,
    myDueSatang,
    optimizedSettlementList,
    isDemo,
    triggerDemoLock,
  } = useGroup();

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPreset, setPaymentPreset] = useState<{ toId: string; amount: number } | null>(null);

  // คำนวณรายจ่ายสัปดาห์นี้ตาม weekStartsOn
  const activeExpenses = expenses.filter((e) => e.status === "active");
  const now = new Date();
  const weekStart = startOfWeek(now, group.weekStartsOn).toISOString().slice(0, 10);
  const weekEnd = endOfWeek(now, group.weekStartsOn).toISOString().slice(0, 10);

  const thisWeekTotalSatang = activeExpenses
    .filter((e) => e.expenseDate >= weekStart && e.expenseDate <= weekEnd)
    .reduce((sum, e) => sum + e.totalAmountSatang, 0);

  // รายการรอตรวจสลิป (เฉพาะรายการที่ submitted และผู้รับคือเรา หรือเราเป็น admin)
  const pendingReviewPayments = payments.filter(
    (p) => p.status === "submitted" && (p.toMemberId === currentMemberId || isAdmin)
  );

  // สรุปยอดตามหมวดหมู่สำหรับกราฟ
  const categorySummary = activeExpenses.reduce((acc, e) => {
    acc[e.categoryName] = (acc[e.categoryName] || 0) + e.totalAmountSatang;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categorySummary).map(([name, satang]) => ({
    name,
    value: satang / 100, // แสดงเป็นบาทใน tooltip
    amountSatang: satang,
    color: CATEGORY_COLORS[name] || "#95c6b0",
  }));

  // รายการที่ฉันควรชำระในปัจจุบัน
  const mySettlementsToPay = optimizedSettlementList.filter(
    (s) => s.fromMemberId === currentMemberId
  );

  const handleOpenPay = (toId: string, amountSatang: number) => {
    if (isDemo) {
      triggerDemoLock("การแจ้งชำระเงินและเคลียร์หนี้");
      return;
    }
    setPaymentPreset({ toId, amount: amountSatang });
    setPaymentModalOpen(true);
  };

  // หากยังไม่ได้ล็อกอิน ให้แสดงหน้า Landing Page แนะนำเว็บไซต์
  if (!isAuthenticated) {
    return (
      <main className="shell">
        <Navbar />
        <LandingPage />
      </main>
    );
  }

  return (
    <main className="shell">
      <Navbar />

      <section className="intro">
        <div>
          <p className="eyebrow">
            กลุ่ม: <strong>{group.name}</strong> · วันนี้ {now.toLocaleDateString("th-TH", { dateStyle: "long" })}
          </p>
          <h1>สวัสดี, {currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name} 👋</h1>
        </div>

        <div className="actions-row">
          <Link
            href="/profile"
            className="secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title={isDemo ? "ข้อมูลโปรไฟล์ (ถูกล็อกในโหมด Demo)" : undefined}
          >
            {isDemo ? "🔒 ข้อมูลรับเงิน" : "👤 ข้อมูลรับเงินของฉัน"}
          </Link>
          <Link
            href="/groups/new"
            className="secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title={isDemo ? "สร้างกลุ่มใหม่ (ถูกล็อกในโหมด Demo)" : undefined}
          >
            {isDemo ? "🔒 ＋ สร้างกลุ่ม" : "＋ สร้างกลุ่ม"}
          </Link>
          {isGroupCreator && (
            <Link
              href="/settings"
              className="secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              title={isDemo ? "ตั้งค่ากลุ่ม (ถูกล็อกในโหมด Demo)" : undefined}
            >
              {isDemo ? "🔒 ตั้งค่ากลุ่ม" : "⚙️ ตั้งค่ากลุ่ม"}
            </Link>
          )}
          <Link
            href="/expenses/new"
            className="primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: isDemo ? "0 4px 14px rgba(31, 111, 83, 0.3)" : undefined,
              fontWeight: 700,
            }}
          >
            {isDemo ? "⚡ ＋ เพิ่มรายจ่าย (เปิดทดลอง)" : "＋ เพิ่มรายจ่าย"}
          </Link>
          {!isDemo && (
            <Link href="/balances" className="primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              💳 เคลียร์เงิน / ชำระหนี้
            </Link>
          )}
        </div>
      </section>

      {/* กล่องไฮไลต์โหมดทดลองใช้งาน (Demo Callout) */}
      {isDemo && (
        <section
          className="card"
          style={{
            background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
            border: "2px solid #f59e0b",
            marginBottom: "24px",
            padding: "18px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "20px" }}>⚡</span>
                <strong style={{ fontSize: "16px", color: "#92400e" }}>
                  คุณกำลังอยู่ในโหมดทดลองใช้งาน (Demo Mode)
                </strong>
                <span
                  style={{
                    background: "#f59e0b",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "99px",
                  }}
                >
                  เปิดเฉพาะเพิ่มรายจ่าย
                </span>
              </div>
              <p style={{ margin: 0, color: "#78350f", fontSize: "13px", lineHeight: 1.5 }}>
                ในโหมดนี้ ระบบเปิดให้ทดลองใช้งานเฉพาะ <strong>&quot;＋ เพิ่มรายจ่าย&quot;</strong> เท่านั้น เพื่อให้คุณได้ทดสอบความแม่นยำในการหารเงินระดับสตางค์ <br />
                ฟังก์ชันการชำระหนี้, แนบ/ตรวจสลิป, การตั้งค่ากลุ่ม และการจัดการแอดมินถูกล็อกไว้
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <Link
                href="/expenses/new"
                className="primary"
                style={{ fontSize: "13px", fontWeight: 700 }}
              >
                ＋ ลองเพิ่มรายจ่ายเลย
              </Link>
              <Link
                href="/register"
                className="secondary"
                style={{
                  fontSize: "13px",
                  background: "#fff",
                  color: "#92400e",
                  borderColor: "#f59e0b",
                  fontWeight: 600,
                }}
              >
                🚀 สมัครสมาชิกเพื่อปลดล็อก
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* สรุปสถิติ 4 ช่อง (คลิกเพื่อไปยังหน้าที่เกี่ยวข้องทันที) */}
      <section className="grid">
        <Link href="/balances" className="card card-clickable" title="คลิกเพื่อไปหน้าชำระเงิน">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="stat-label">ยอดที่คุณต้องชำระ</div>
            <span style={{ fontSize: "11px", color: "#1f6f53", fontWeight: 600 }}>ชำระเงิน →</span>
          </div>
          <div className={`stat-value ${myOwedSatang > 0 ? "negative" : ""}`}>
            {formatTHB(myOwedSatang)}
          </div>
          <div className="sub">
            {myOwedSatang > 0 ? `มีข้อเสนอต้องโอน ${mySettlementsToPay.length} รายการ (คลิกเพื่อดู)` : "ไม่มีหนี้ค้างชำระ"}
          </div>
        </Link>

        <Link href="/balances" className="card card-clickable" title="คลิกเพื่อดูยอดคงเหลือ">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="stat-label">ยอดที่คุณควรได้รับ</div>
            <span style={{ fontSize: "11px", color: "#1f6f53", fontWeight: 600 }}>ดูยอด →</span>
          </div>
          <div className={`stat-value ${myDueSatang > 0 ? "positive" : ""}`}>
            {formatTHB(myDueSatang)}
          </div>
          <div className="sub">
            {myDueSatang > 0 ? "รอสมาชิกชำระคืน" : "ไม่มีสมาชิกค้างจ่ายคุณ"}
          </div>
        </Link>

        <Link href="/expenses" className="card card-clickable" title="คลิกเพื่อดูรายการรายจ่าย">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="stat-label">รายจ่ายสัปดาห์นี้ของกลุ่ม</div>
            <span style={{ fontSize: "11px", color: "#1f6f53", fontWeight: 600 }}>ดูรายจ่าย →</span>
          </div>
          <div className="stat-value">{formatTHB(thisWeekTotalSatang)}</div>
          <div className="sub">
            เริ่มสัปดาห์: {group.weekStartsOn === 1 ? "วันจันทร์" : group.weekStartsOn === 0 ? "วันอาทิตย์" : `วันที่ ${group.weekStartsOn}`}
          </div>
        </Link>

        <Link href="/balances" className="card card-clickable" title="คลิกเพื่อตรวจสลิป">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="stat-label">รอตรวจสอบสลิป</div>
            {pendingReviewPayments.length > 0 && (
              <span style={{ fontSize: "11px", color: "#d97706", fontWeight: 600 }}>ตรวจสลิป →</span>
            )}
          </div>
          <div className="stat-value" style={{ color: pendingReviewPayments.length > 0 ? "#d97706" : "#1f6f53" }}>
            {pendingReviewPayments.length} รายการ
          </div>
          <div className="sub">
            {pendingReviewPayments.length > 0 ? "มีสลิปใหม่รอการยืนยัน" : "เรียบร้อยทั้งหมด"}
          </div>
        </Link>
      </section>


      {/* คอนเทนต์หลัก 2 คอลัมน์ */}
      <section className="content-2col">
        {/* คอลัมน์ซ้าย: รายจ่ายล่าสุด & รายการรอตรวจสลิป */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* รายการรอตรวจสลิป (ถ้ามี) */}
          {pendingReviewPayments.length > 0 && (
            <div className="card" style={{ borderLeft: "4px solid #d97706" }}>
              <div className="section-title">
                <span style={{ color: "#d97706" }}>🔔 สลิปที่รอให้คุณตรวจสอบ ({pendingReviewPayments.length})</span>
                <Link href="/balances" className="link">
                  ดูทั้งหมด →
                </Link>
              </div>
              {pendingReviewPayments.map((p) => {
                const fromM = members.find((m) => m.id === p.fromMemberId);
                return (
                  <div key={p.id} className="settle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{fromM?.name} แจ้งโอนเงิน {formatTHB(p.amountSatang)}</strong>
                      <p>แนบสลิปแล้ว · รอการยืนยันเพื่อลดหนี้</p>
                    </div>
                    <button className="primary" style={{ padding: "7px 12px", fontSize: "12px" }} onClick={() => setSelectedPayment(p)}>
                      ตรวจสลิป
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* รายจ่ายล่าสุด */}
          <div className="card">
            <div className="section-title">
              <span>รายจ่ายล่าสุด</span>
              <Link href="/expenses" className="link">
                ดูทั้งหมด ({expenses.length}) →
              </Link>
            </div>

            {expenses.slice(0, 4).map((e) => {
              const myShare = e.shares.find((s) => s.memberId === currentMemberId)?.amountSatang ?? 0;
              const payerNames = e.payers
                .map((p) => members.find((m) => m.id === p.memberId)?.name ?? "สมาชิก")
                .join(", ");

              return (
                <div className="expense" key={e.id}>
                  <div className="icon">
                    {e.categoryName === "อาหาร" ? "🍜" : e.categoryName === "น้ำดื่ม" ? "💧" : "🛒"}
                  </div>
                  <div>
                    <div className="expense-name" style={{ textDecoration: e.status === "voided" ? "line-through" : "none" }}>
                      {e.title} {e.status === "voided" && <span className="badge badge-voided">ยกเลิกแล้ว</span>}
                    </div>
                    <div className="expense-meta">
                      {e.categoryName} · {e.expenseDate} · จ่ายโดย {payerNames}
                    </div>
                  </div>
                  <div className="amount">
                    {formatTHB(e.totalAmountSatang)}
                    {e.status === "active" && (
                      <small style={{ color: myShare > 0 ? "#cf4f36" : "#6a766e" }}>
                        ส่วนของคุณ {formatTHB(myShare)}
                      </small>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* คอลัมน์ขวา: กราฟค่าใช้จ่าย & รายการที่ควรชำระ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* กราฟสัดส่วนค่าใช้จ่าย */}
          <div className="card">
            <div className="section-title">
              <span>สัดส่วนค่าใช้จ่ายตามหมวดหมู่</span>
              <Link href="/expenses" className="link">
                ดูรายจ่ายทั้งหมด →
              </Link>
            </div>

            {chartData.length > 0 ? (
              <>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={4}
                      >
                        {chartData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ marginTop: "12px" }}>
                  {chartData.map((d) => (
                    <div className="breakdown-row" key={d.name}>
                      <span>
                        <i className="dot" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <strong>{formatTHB(d.amountSatang)}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">ยังไม่มีรายการค่าใช้จ่าย</div>
            )}
          </div>

          {/* รายการที่ควรชำระตามข้อเสนอ Settlement */}
          <div className="card">
            <div className="section-title">
              <span>ข้อเสนอการชำระเงินของคุณ</span>
              <Link href="/balances" className="link">
                ดูภาพรวมทั้งหมด →
              </Link>
            </div>

            {mySettlementsToPay.length > 0 ? (
              mySettlementsToPay.map((s, idx) => {
                const toM = members.find((m) => m.id === s.toMemberId);
                return (
                  <div className="settle" key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>โอนให้ {toM?.name}: {formatTHB(s.amountSatang)}</strong>
                        <p>คำนวณจากยอดสุทธิเพื่อลดจำนวนการโอน</p>
                      </div>
                      <button
                        className="outline"
                        onClick={() => handleOpenPay(s.toMemberId, s.amountSatang)}
                      >
                        แจ้งชำระเงิน
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state" style={{ padding: "20px 0" }}>
                🎉 คุณไม่มีหนี้ที่ต้องชำระในขณะนี้
              </div>
            )}

            <div className="notice">
              💡 เมื่อโอนเงินแล้ว ให้กดแจ้งชำระพร้อมแนบสลิป ยอดหนี้จะปรับลดทันทีที่ผู้รับยืนยัน
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultRecipientId={paymentPreset?.toId}
        defaultAmountSatang={paymentPreset?.amount}
        settlementMode="optimized"
      />

      <ProofModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </main>
  );
}
