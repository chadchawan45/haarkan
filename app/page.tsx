"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useGroup,
  ExpenseRecord,
  PaymentRecord,
  GroupSettings,
  CLASSROOM_GRADIENTS,
} from "@/lib/group-context";
import { formatTHB } from "@/lib/money";
import { Navbar } from "@/components/Navbar";
import { LandingPage } from "@/components/LandingPage";
import { PaymentModal } from "@/components/PaymentModal";
import { ProofModal } from "@/components/ProofModal";
import { startOfWeek, endOfWeek } from "@/lib/periods";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    groups,
    group,
    switchGroup,
    joinGroupByCode,
    setJoinModalOpen,
    deleteGroup,
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
    isDemo,
    triggerDemoLock,
  } = useGroup();

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<GroupSettings | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleOpenDeleteModal = (targetGroup: GroupSettings) => {
    if (isDemo) {
      triggerDemoLock("การลบกลุ่ม");
      return;
    }
    if (groups.length <= 1) {
      alert("⚠️ ไม่สามารถลบได้ เนื่องจากระบบต้องมีกลุ่มอย่างน้อย 1 กลุ่ม");
      return;
    }
    setDeleteError(null);
    setRoomToDelete(targetGroup);
  };

  const handleConfirmDelete = () => {
    if (!roomToDelete) return;
    const res = deleteGroup(roomToDelete.id);
    if (!res.success) {
      setDeleteError(res.message);
    } else {
      setRoomToDelete(null);
    }
  };

  useEffect(() => {
    const joinCode = searchParams.get("join") || searchParams.get("code");
    if (joinCode) {
      joinGroupByCode(joinCode).then((res) => {
        if (res.success) {
          router.replace("/");
        }
      });
    }
  }, [searchParams, joinGroupByCode, router]);

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPreset, setPaymentPreset] = useState<{ toId: string; amount: number } | null>(null);

  // คำนวณรายจ่ายเฉพาะกลุ่มปัจจุบัน
  const currentGroupExpenses = expenses.filter(
    (e) => !e.groupId || e.groupId === group.id
  );
  const activeExpenses = currentGroupExpenses.filter((e) => e.status === "active");

  const now = new Date();
  const weekStart = startOfWeek(now, group.weekStartsOn).toISOString().slice(0, 10);
  const weekEnd = endOfWeek(now, group.weekStartsOn).toISOString().slice(0, 10);

  const thisWeekTotalSatang = activeExpenses
    .filter((e) => e.expenseDate >= weekStart && e.expenseDate <= weekEnd)
    .reduce((sum, e) => sum + e.totalAmountSatang, 0);

  // รายการรอตรวจสลิปเฉพาะกลุ่มปัจจุบัน
  const pendingReviewPayments = payments.filter(
    (p) =>
      (!p.groupId || p.groupId === group.id) &&
      p.status === "submitted" &&
      (p.toMemberId === currentMemberId || isAdmin)
  );

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

      {/* แถบต้อนรับด้านบน */}
      <section className="welcome-section">
        <div>
          <h1 className="welcome-title">
            สวัสดี, {currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name} 👋
          </h1>
          <p className="welcome-subtitle">
            จัดการบิลและแชร์ค่าใช้จ่ายในกลุ่มของคุณอย่างโปร่งใสระดับสตางค์
          </p>
        </div>

        <div className="welcome-actions">
          <button
            type="button"
            className="secondary touch-action-btn"
            onClick={() => setJoinModalOpen(true)}
            title="กรอกรหัส 6 หลักเพื่อเข้าร่วมกลุ่ม"
          >
            🔑 เข้าร่วมกลุ่ม
          </button>
          <Link
            href="/groups/new"
            className="secondary touch-action-btn"
          >
            ＋ สร้างกลุ่ม
          </Link>
          <Link
            href="/expenses/new"
            className="primary touch-action-btn"
            style={{
              boxShadow: "0 4px 12px rgba(31, 111, 83, 0.25)",
            }}
          >
            ＋ เพิ่มรายจ่าย
          </Link>
        </div>
      </section>

      {/* แถบเลือกสลับกลุ่ม (Group Switcher Bar) */}
      <section style={{ marginBottom: "20px" }}>
        <div className="group-switcher-bar">
          <span className="group-switcher-label">
            👥 กลุ่มของคุณ ({groups.length}):
          </span>

          <div className="group-switcher-scroll">
            {groups.map((g) => {
              const isActive = g.id === group.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => switchGroup(g.id)}
                  className={`group-pill ${isActive ? "active" : ""}`}
                >
                  <span>{isActive ? "✓" : "📁"}</span>
                  <strong>{g.name}</strong>
                  <span className="group-pill-code">({g.code})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* กล่องไฮไลต์โหมดทดลองใช้งาน (Demo Callout) */}
      {isDemo && (
        <section
          className="card"
          style={{
            background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
            border: "2px solid #f59e0b",
            marginBottom: "20px",
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "18px" }}>⚡</span>
                <strong style={{ fontSize: "15px", color: "#92400e" }}>
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
                ในโหมดนี้ ระบบเปิดให้ทดลองใช้งานเฉพาะ <strong>&quot;＋ เพิ่มรายจ่าย&quot;</strong> เพื่อทดสอบการคำนวณเงิน
              </p>
            </div>
            <Link
              href="/register"
              className="primary"
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
        </section>
      )}

      {/* คอนเทนเนอร์กลุ่มปัจจุบัน: ภาพรวมสถิติและรายจ่ายทั้งหมดจัดวางอยู่ภายในกลุ่มนี้ */}
      <section
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          borderRadius: "18px",
          border: "1px solid rgba(31, 111, 83, 0.25)",
          marginBottom: "36px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        {/* แบนเนอร์หัวกลุ่ม (Group Hero Header) */}
        <div
          className="group-hero-header"
          style={{
            background: group.bannerGradient || CLASSROOM_GRADIENTS[0],
            color: "#fff",
            padding: "24px 26px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.2)",
                  padding: "3px 10px",
                  borderRadius: "99px",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                <span>👥 กลุ่มที่กำลังเปิดใช้งาน</span>
              </div>

              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  color: "#fff",
                }}
              >
                {group.name}
              </h2>

              {group.description && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.9)",
                    maxWidth: "600px",
                    lineHeight: 1.5,
                  }}
                >
                  {group.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  fontSize: "13px",
                }}
              >
                <div
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ opacity: 0.85 }}>🏷️ รหัสกลุ่ม:</span>
                  <strong style={{ fontFamily: "monospace", letterSpacing: "2px", fontSize: "15px" }}>
                    {group.code}
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(group.code);
                      setCopiedCodeId(group.id);
                      setTimeout(() => setCopiedCodeId(null), 2000);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      color: "#fff",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                    title="คัดลอกรหัสกลุ่ม"
                  >
                    {copiedCodeId === group.id ? "✓ คัดลอกแล้ว" : "📋 คัดลอก"}
                  </button>
                </div>

                <span style={{ opacity: 0.9 }}>👥 สมาชิก {members.length} คน</span>
                <span style={{ opacity: 0.9 }}>
                  👑 {isGroupCreator ? "คุณคือผู้สร้างกลุ่ม" : "Admin"}
                </span>
              </div>
            </div>

            <div className="group-hero-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Link
                href="/expenses/new"
                className="primary group-hero-add-btn"
                style={{
                  background: "#fff",
                  color: "#1f6f53",
                  fontWeight: 700,
                  padding: "9px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                ＋ เพิ่มรายจ่ายในกลุ่มนี้
              </Link>

              {groups.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleOpenDeleteModal(group)}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    color: "#fff",
                    borderRadius: "10px",
                    padding: "9px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="ลบกลุ่มนี้"
                >
                  🗑️ ลบกลุ่ม
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ส่วนเนื้อหาภายในกลุ่ม: ภาพรวมและสถิติ 4 ช่อง */}
        <div className="group-body-content" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "17px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📊</span> ภาพรวมค่าใช้จ่ายของกลุ่ม &ldquo;{group.name}&rdquo;
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted, #6a766e)" }}>
              เริ่มสัปดาห์: {group.weekStartsOn === 1 ? "วันจันทร์" : "วันอาทิตย์"}
            </span>
          </div>

          {/* สรุปสถิติ 4 ช่อง ภายในกลุ่ม */}
          <div className="stats-grid-dashboard">
            <Link href="/balances" className="card card-clickable" style={{ margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="stat-label">ยอดที่คุณต้องชำระ</div>
                <span style={{ fontSize: "11px", color: "#1f6f53", fontWeight: 600 }}>ชำระเงิน →</span>
              </div>
              <div className={`stat-value ${myOwedSatang > 0 ? "negative" : ""}`}>
                {formatTHB(myOwedSatang)}
              </div>
              <div className="sub">
                {myOwedSatang > 0 ? "มียอดต้องเคลียร์ (คลิกเพื่อดู)" : "ไม่มีหนี้ค้างชำระ"}
              </div>
            </Link>

            <Link href="/balances" className="card card-clickable" style={{ margin: 0 }}>
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

            <Link href="/expenses" className="card card-clickable" style={{ margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="stat-label">รายจ่ายสัปดาห์นี้ของกลุ่ม</div>
                <span style={{ fontSize: "11px", color: "#1f6f53", fontWeight: 600 }}>ดูรายจ่าย →</span>
              </div>
              <div className="stat-value">{formatTHB(thisWeekTotalSatang)}</div>
              <div className="sub">ยอดรวมสัปดาห์นี้</div>
            </Link>

            <Link href="/balances" className="card card-clickable" style={{ margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="stat-label">รอตรวจสอบสลิป</div>
                {pendingReviewPayments.length > 0 && (
                  <span style={{ fontSize: "11px", color: "#d97706", fontWeight: 600 }}>ตรวจสลิป →</span>
                )}
              </div>
              <div
                className="stat-value"
                style={{ color: pendingReviewPayments.length > 0 ? "#d97706" : "#1f6f53" }}
              >
                {pendingReviewPayments.length} รายการ
              </div>
              <div className="sub">
                {pendingReviewPayments.length > 0 ? "มีสลิปใหม่รอการยืนยัน" : "เรียบร้อยทั้งหมด"}
              </div>
            </Link>
          </div>

          {/* รายการรอตรวจสลิป (ถ้ามี) */}
          {pendingReviewPayments.length > 0 && (
            <div className="card" style={{ borderLeft: "4px solid #d97706", marginBottom: "20px" }}>
              <div className="section-title">
                <span style={{ color: "#d97706" }}>
                  🔔 สลิปที่รอให้คุณตรวจสอบ ({pendingReviewPayments.length})
                </span>
                <Link href="/balances" className="link">
                  ดูทั้งหมด →
                </Link>
              </div>
              {pendingReviewPayments.map((p) => {
                const fromM = members.find((m) => m.id === p.fromMemberId);
                return (
                  <div
                    key={p.id}
                    className="settle"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>
                        {fromM?.name} แจ้งโอนเงิน {formatTHB(p.amountSatang)}
                      </strong>
                      <p>แนบสลิปแล้ว · รอการยืนยันเพื่อลดหนี้</p>
                    </div>
                    <button
                      className="primary"
                      style={{ padding: "7px 12px", fontSize: "12px" }}
                      onClick={() => setSelectedPayment(p)}
                    >
                      ตรวจสลิป
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* รายจ่ายล่าสุดของกลุ่มนี้ (รายจ่ายล่าสุดแสดงเต็มแถว สะอาดตา ไม่รก) */}
          <div className="card" style={{ margin: 0 }}>
            <div className="section-title">
              <span style={{ fontSize: "16px", fontWeight: 700 }}>🛒 รายจ่ายล่าสุดของกลุ่ม</span>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Link href="/expenses" className="link" style={{ fontSize: "13px" }}>
                  ดูรายจ่ายทั้งหมด ({currentGroupExpenses.length}) →
                </Link>
              </div>
            </div>

            {currentGroupExpenses.length === 0 ? (
              <div className="empty-state" style={{ padding: "36px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>📝</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--text-main, #334155)",
                    fontSize: "16px",
                    marginBottom: "4px",
                  }}
                >
                  ยังไม่มีรายการรายจ่ายในกลุ่มนี้
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted, #6a766e)", margin: "0 0 16px" }}>
                  กดปุ่มด้านล่างเพื่อเริ่มหารค่าใช้จ่ายกับเพื่อน ๆ ในกลุ่ม
                </p>
                <Link
                  href="/expenses/new"
                  className="primary"
                  style={{
                    display: "inline-flex",
                    padding: "8px 18px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  ＋ เพิ่มรายจ่ายแรก
                </Link>
              </div>
            ) : (
              currentGroupExpenses.slice(0, 5).map((e) => {
                const myShare =
                  e.shares.find((s) => s.memberId === currentMemberId)?.amountSatang ?? 0;
                const payerNames = e.payers
                  .map((p) => members.find((m) => m.id === p.memberId)?.name ?? "สมาชิก")
                  .join(", ");

                return (
                  <div className="expense" key={e.id}>
                    <div className="icon">
                      {e.categoryName === "อาหาร"
                        ? "🍜"
                        : e.categoryName === "น้ำดื่ม"
                        ? "💧"
                        : e.categoryName === "ของใช้ส่วนกลาง"
                        ? "🛒"
                        : "🧾"}
                    </div>
                    <div>
                      <div
                        className="expense-name"
                        style={{ textDecoration: e.status === "voided" ? "line-through" : "none" }}
                      >
                        {e.title}{" "}
                        {e.status === "voided" && (
                          <span className="badge badge-voided">ยกเลิกแล้ว</span>
                        )}
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
              })
            )}
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

      {/* Delete Group Confirmation Modal */}
      {roomToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setRoomToDelete(null)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "440px",
              width: "92%",
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: "16px",
              padding: "24px",
              color: "var(--text-main, #1e293b)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "28px" }}>🗑️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#dc2626" }}>
                  ยืนยันการลบกลุ่ม
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted, #6a766e)" }}>
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "18px",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่ม <strong>&ldquo;{roomToDelete.name}&rdquo;</strong>{" "}
              (รหัสกลุ่ม:{" "}
              <code style={{ color: "#dc2626", fontWeight: 700 }}>{roomToDelete.code}</code>)?
              <div style={{ fontSize: "12px", color: "#b91c1c", marginTop: "6px" }}>
                ⚠️ ข้อมูลค่าใช้จ่าย สมาชิก และประวัติการชำระเงินของกลุ่มนี้จะถูกนำออกจากระบบ
              </div>
            </div>

            {deleteError && (
              <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "14px", fontWeight: 600 }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setRoomToDelete(null)}
                style={{ padding: "8px 16px", borderRadius: "10px", fontWeight: 600 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                }}
              >
                ยืนยันลบกลุ่ม
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <div style={{ textAlign: "center", padding: "60px 20px" }}>กำลังโหลดข้อมูลกลุ่ม...</div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
