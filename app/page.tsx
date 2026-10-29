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
    optimizedSettlementList,
    isDemo,
    triggerDemoLock,
  } = useGroup();

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<GroupSettings | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  const handleShareGroup = async (targetGroup: GroupSettings) => {
    const inviteUrl = `${window.location.origin}/invites/${targetGroup.code}`;
    const shareData = {
      title: `เข้าร่วมกลุ่ม "${targetGroup.name}" บน หารกัน`,
      text: `มาหารค่าใช้จ่ายกลุ่ม "${targetGroup.name}" ด้วยกันบนเว็บ หารกัน! รหัสกลุ่ม: ${targetGroup.code}`,
      url: inviteUrl,
    };

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text}\n${inviteUrl}`);
      setCopiedShareId(targetGroup.id);
      setTimeout(() => setCopiedShareId(null), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleOpenDeleteModal = (targetGroup: GroupSettings) => {
    if (isDemo) {
      triggerDemoLock("การลบกลุ่ม");
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
      const clean = joinCode.trim().toUpperCase();
      if (!isAuthenticated) {
        // หากยังไม่ได้เข้าสู่ระบบ ให้พาไปหน้ารับคำเชิญ เพื่อดูรายละเอียดกลุ่มและเข้าสู่ระบบก่อน
        router.push(`/invites/${clean}`);
        return;
      }
      joinGroupByCode(clean).then((res) => {
        if (res.success) {
          alert(`🎉 เข้าร่วมกลุ่ม "${res.group?.name || clean}" สำเร็จ!`);
          router.replace("/");
        } else {
          alert(`⚠️ ${res.message}`);
          router.replace("/");
        }
      });
    }
  }, [searchParams, isAuthenticated, joinGroupByCode, router]);

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPreset, setPaymentPreset] = useState<{ toId: string; amount: number } | null>(null);

  // คำนวณรายจ่ายเฉพาะกลุ่มปัจจุบัน
  const currentGroupExpenses = expenses.filter(
    (e) => !e.groupId || e.groupId === group.id
  );
  const activeExpenses = currentGroupExpenses.filter((e) => e.status === "active");

  // รายการรอตรวจสลิปเฉพาะกลุ่มปัจจุบัน
  const pendingReviewPayments = payments.filter(
    (p) =>
      (!p.groupId || p.groupId === group.id) &&
      p.status === "submitted" &&
      (p.toMemberId === currentMemberId || isAdmin)
  );

  // หนี้ที่คุณต้องจ่ายและยอดที่คุณควรได้รับ (เฉพาะกลุ่มปัจจุบัน)
  const myDebts = optimizedSettlementList.filter((s) => s.fromMemberId === currentMemberId);
  const myCredits = optimizedSettlementList.filter((s) => s.toMemberId === currentMemberId);

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
      <section className="welcome-section animate-in">
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
          >
            ＋ เพิ่มรายจ่าย
          </Link>
        </div>
      </section>

      {/* กล่องไฮไลต์โหมดทดลองใช้งาน (Demo Callout) */}
      {isDemo && (
        <section className="card demo-callout animate-in delay-1">
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
                <span className="demo-badge">
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

      {/* กรณีผู้ใช้ยังไม่มีกลุ่ม (เช่น เพิ่งสมัครสมาชิกใหม่) */}
      {groups.length === 0 ? (
        <section
          className="card animate-in delay-1"
          style={{
            padding: "50px 24px",
            textAlign: "center",
            borderRadius: "18px",
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border, #eef0ed)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            marginBottom: "36px",
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "14px" }}>✨</div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 10px" }}>
            ยินดีต้อนรับสู่ หารกัน!
          </h2>
          <p
            style={{
              color: "var(--text-muted, #6a766e)",
              fontSize: "14px",
              maxWidth: "460px",
              margin: "0 auto 24px",
              lineHeight: 1.6,
            }}
          >
            คุณยังไม่มีกลุ่มในขณะนี้ สามารถเริ่มต้นใช้งานได้ง่ายๆ โดยการสร้างกลุ่มใหม่ หรือใส่รหัส 6 หลักเพื่อเข้าร่วมกลุ่มของเพื่อน
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/groups/new"
              className="primary"
              style={{
                padding: "12px 22px",
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "12px",
                textDecoration: "none",
              }}
            >
              ＋ สร้างกลุ่มใหม่
            </Link>
            <button
              type="button"
              className="secondary"
              onClick={() => setJoinModalOpen(true)}
              style={{
                padding: "12px 22px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              🔑 เข้าร่วมกลุ่มด้วยรหัส
            </button>
          </div>
        </section>
      ) : (
        /* คอนเทนเนอร์กลุ่มปัจจุบัน: สรุปสถานะการเงินจัดวางอยู่ภายในกลุ่มนี้ */
        <section
          className="card animate-in delay-1"
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
                  gap: "10px",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span className="group-hero-tag">
                  👥 กลุ่มที่กำลังเปิดใช้งาน
                </span>
                {groups.length > 1 && (
                  <select
                    value={group.id}
                    onChange={(e) => switchGroup(e.target.value)}
                    style={{
                      background: "rgba(0, 0, 0, 0.35)",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      outline: "none",
                    }}
                    title="สลับไปยังกลุ่มอื่นของคุณ"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id} style={{ color: "#111" }}>
                        สลับกลุ่ม: {g.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "0 0 6px" }}>
                <button
                  type="button"
                  onClick={() => setMembersModalOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    color: "#fff",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    textAlign: "left",
                  }}
                  title="คลิกที่ชื่อกลุ่มเพื่อดูรายชื่อสมาชิกในกลุ่มนี้"
                >
                  <span className="group-hero-title">{group.name}</span>
                  <span className="group-hero-tag" style={{ fontSize: "12px", margin: 0 }}>
                    👥 ดูสมาชิก
                  </span>
                </button>
              </div>

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

              <div className="group-info-bar">
                <div className="group-code-pill action-bar">
                  <span style={{ opacity: 0.85 }}>🏷️ รหัสกลุ่ม:</span>
                  <strong style={{ fontFamily: "monospace", letterSpacing: "2px", fontSize: "15px" }}>
                    {group.code}
                  </strong>
                  <button
                    type="button"
                    className="action-item"
                    onClick={() => {
                      navigator.clipboard.writeText(group.code);
                      setCopiedCodeId(group.id);
                      setTimeout(() => setCopiedCodeId(null), 2000);
                    }}
                    title="คัดลอกรหัสกลุ่ม 6 ตัว"
                  >
                    {copiedCodeId === group.id ? "✓ คัดลอกแล้ว" : "📋 คัดลอก"}
                  </button>
                  <button
                    type="button"
                    className="action-item"
                    onClick={() => {
                      const link = `${window.location.origin}/invites/${group.code}`;
                      navigator.clipboard.writeText(link);
                      setCopiedLinkId(group.id);
                      setTimeout(() => setCopiedLinkId(null), 2000);
                    }}
                    title="คัดลอกลิงก์เชิญสำหรับส่งให้เพื่อน"
                  >
                    {copiedLinkId === group.id ? "✓ ลิงก์แล้ว" : "🔗 ลิงก์"}
                  </button>
                  <button
                    type="button"
                    className="action-item"
                    onClick={() => handleShareGroup(group)}
                    title="แชร์กลุ่มไปยัง LINE, Messenger หรือแอปอื่นๆ"
                  >
                    {copiedShareId === group.id ? "✓ แชร์แล้ว" : "📤 แชร์"}
                  </button>
                </div>

                <button
                  type="button"
                  className="group-members-pill"
                  onClick={() => setMembersModalOpen(true)}
                  title="คลิกเพื่อดูรายชื่อสมาชิกในกลุ่มนี้"
                >
                  👥 สมาชิก {members.length} คน
                </button>
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

        {/* ส่วนเนื้อหาภายในกลุ่ม: สรุปยอดเงินแบบเรียบง่าย */}
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
                fontSize: "16px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>💳</span> สรุปสถานะการเงินของคุณในกลุ่ม &ldquo;{group.name}&rdquo;
            </h3>
          </div>

          {/* สรุปสถิติ 3 ช่องแบบเรียบง่ายและเป็นระเบียบ */}
          <div className="stats-grid-dashboard animate-in delay-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <Link href="/balances" className="card card-clickable card-press" style={{ margin: 0 }}>
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

            <Link href="/balances" className="card card-clickable card-press" style={{ margin: 0 }}>
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

            <Link href="/balances" className="card card-clickable card-press" style={{ margin: 0 }}>
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

          {/* รายการที่คุณต้องโอนเคลียร์เงิน (Actionable Settlements) */}
          {myDebts.length > 0 && (
            <div
              className="card"
              style={{
                borderLeft: "4px solid #ef4444",
                marginTop: "20px",
                marginBottom: 0,
                background: "var(--card-bg, #ffffff)",
              }}
            >
              <div className="section-title">
                <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>💸</span>
                  <strong>ยอดที่คุณต้องโอนเงิน ({myDebts.length} รายการ)</strong>
                </span>
                <Link href="/balances" className="link">
                  ดูแผนผังการเคลียร์หนี้ →
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {myDebts.map((debt, idx) => {
                  const toM = members.find((m) => m.id === debt.toMemberId);
                  const toName = toM?.nickname
                    ? `${toM.nickname} (${toM.name})`
                    : toM?.name || "เพื่อนในกลุ่ม";

                  return (
                    <div key={idx} className="debt-card debt-card-danger">
                      <div className="debt-user">
                        <div
                          className="debt-avatar"
                          style={{
                            background: toM?.avatarColor || "#1f6f53",
                          }}
                        >
                          {toM?.avatarUrl ? (
                            <img
                              src={toM.avatarUrl}
                              alt={toName}
                            />
                          ) : (
                            (toM?.nickname || toM?.name || "U").slice(0, 1)
                          )}
                        </div>
                        <div>
                          <div className="debt-name">
                            โอนให้ {toName}
                          </div>
                          <div className="debt-detail">
                            {toM?.promptpayNumber
                              ? `พร้อมเพย์: ${toM.promptpayNumber}`
                              : toM?.bankAccountNumber
                              ? `${toM.bankName || "ธนาคาร"} ${toM.bankAccountNumber}`
                              : "กดปุ่มเพื่อดูวิธีชำระ"}
                          </div>
                        </div>
                      </div>

                      <div className="debt-actions">
                        <span className="debt-amount" style={{ color: "#dc2626" }}>
                          {formatTHB(debt.amountSatang)}
                        </span>
                        <button
                          type="button"
                          className="primary"
                          style={{
                            padding: "8px 14px",
                            fontSize: "12px",
                            borderRadius: "8px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 8px rgba(31, 111, 83, 0.2)",
                          }}
                          onClick={() => {
                            if (isDemo) {
                              triggerDemoLock("การโอนเงินชำระหนี้");
                              return;
                            }
                            setPaymentPreset({ toId: debt.toMemberId, amount: debt.amountSatang });
                            setPaymentModalOpen(true);
                          }}
                        >
                          💳 โอนเงินทันที
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* รายการที่เพื่อนติดค้างคุณ (เมื่อคุณไม่ต้องจ่ายใคร) */}
          {myDebts.length === 0 && myCredits.length > 0 && (
            <div
              className="card"
              style={{
                borderLeft: "4px solid #1f6f53",
                marginTop: "20px",
                marginBottom: 0,
                background: "var(--card-bg, #ffffff)",
              }}
            >
              <div className="section-title">
                <span style={{ color: "#1f6f53", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>💰</span>
                  <strong>สมาชิกที่ต้องโอนเงินคืนคุณ ({myCredits.length} คน)</strong>
                </span>
                <Link href="/balances" className="link">
                  ดูยอดทั้งหมด →
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                {myCredits.map((credit, idx) => {
                  const fromM = members.find((m) => m.id === credit.fromMemberId);
                  const fromName = fromM?.nickname
                    ? `${fromM.nickname} (${fromM.name})`
                    : fromM?.name || "เพื่อนในกลุ่ม";

                  return (
                    <div key={idx} className="debt-card debt-card-success">
                      <div style={{ fontSize: "13px", color: "var(--text-main)" }}>
                        รอ <strong>{fromName}</strong> โอนเงินคืน
                      </div>
                      <strong style={{ fontSize: "16px", color: "#1f6f53", fontWeight: 800 }}>
                        +{formatTHB(credit.amountSatang)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* สถานะบัญชีสมดุล ไม่มีหนี้ค้าง */}
          {myDebts.length === 0 && myCredits.length === 0 && activeExpenses.length > 0 && (
            <div className="balance-ok">
              <span className="balance-ok-icon">🎉</span>
              <span>
                ยอดบัญชีของคุณสมดุลแล้ว ไม่มีหนี้ค้างชำระในกลุ่ม &ldquo;{group.name}&rdquo;
              </span>
            </div>
          )}

          {/* รายการรอตรวจสลิป (ถ้ามี) */}
          {pendingReviewPayments.length > 0 && (
            <div className="card" style={{ borderLeft: "4px solid #d97706", marginTop: "20px", marginBottom: 0 }}>
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
        </div>
      </section>
      )}

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
      {/* Members Modal (แสดงรายชื่อสมาชิกเมื่อกดที่ชื่อกลุ่ม) */}
      {membersModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setMembersModalOpen(false)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "500px",
              width: "92%",
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: "18px",
              padding: "24px",
              color: "var(--text-main, #1e293b)",
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
              position: "relative",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--primary, #1f6f53)", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  <span>👥</span> รายชื่อสมาชิกในกลุ่ม
                </div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>
                  {group.name}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted, #6a766e)" }}>
                  สมาชิกทั้งหมด {members.length} คน · รหัสกลุ่ม: <strong style={{ fontFamily: "monospace", color: "var(--primary, #1f6f53)" }}>{group.code}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMembersModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  color: "var(--text-muted, #888)",
                  cursor: "pointer",
                  padding: "4px",
                  lineHeight: 1,
                }}
                title="ปิด"
              >
                ✕
              </button>
            </div>

            {/* Members List Scrollable */}
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px", marginBottom: "16px" }}>
              {members.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted, #888)", fontSize: "14px" }}>
                  ยังไม่มีสมาชิกในกลุ่มนี้
                </div>
              ) : (
                members.map((m) => {
                  const cleanName = m.name.replace(/\(คุณ\)/g, "").trim();
                  const isCurrent = m.id === currentMemberId;
                  const isCreator = m.id === group.creatorMemberId;

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: isCurrent ? "rgba(31, 111, 83, 0.05)" : "var(--surface-input, rgba(125, 125, 125, 0.04))",
                        border: isCurrent ? "1.5px solid rgba(31, 111, 83, 0.3)" : "1px solid var(--border, #e5e7eb)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background: m.avatarColor,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "15px",
                            fontWeight: 700,
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt={cleanName}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          ) : (
                            cleanName.slice(0, 1)
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main, #1e293b)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{cleanName}</span>
                            {m.nickname && cleanName !== m.nickname && (
                              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted, #6a766e)" }}>
                                ({m.nickname})
                              </span>
                            )}
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  background: "rgba(31, 111, 83, 0.12)",
                                  color: "var(--primary, #1f6f53)",
                                  padding: "1px 6px",
                                  borderRadius: "99px",
                                  fontWeight: 600,
                                }}
                              >
                                คุณ
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginTop: "3px", color: "var(--text-muted, #6a766e)", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, color: isCreator || m.role === "admin" ? "#d97706" : "inherit" }}>
                              {isCreator ? "👑 ผู้สร้างกลุ่ม" : m.role === "admin" ? "⭐ Admin" : "👤 สมาชิก"}
                            </span>
                            {m.promptpayNumber && (
                              <>
                                <span>·</span>
                                <span>พร้อมเพย์: {m.promptpayNumber}</span>
                              </>
                            )}
                            {m.bankName && m.bankAccountNumber && (
                              <>
                                <span>·</span>
                                <span>{m.bankName} {m.bankAccountNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", borderTop: "1px solid var(--border, #e5e7eb)", paddingTop: "14px" }}>
              {isGroupCreator ? (
                <Link
                  href="/settings"
                  className="secondary"
                  style={{
                    fontSize: "13px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ⚙️ จัดการสมาชิกในกลุ่ม
                </Link>
              ) : <span />}

              <button
                type="button"
                className="primary"
                onClick={() => setMembersModalOpen(false)}
                style={{ padding: "8px 20px", fontSize: "13px", borderRadius: "10px" }}
              >
                ปิด
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
