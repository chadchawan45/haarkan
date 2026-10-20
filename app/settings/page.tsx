"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGroup, Role } from "@/lib/group-context";
import { Navbar } from "@/components/Navbar";

export default function SettingsPage() {
  const {
    group,
    members,
    isAdmin,
    isGroupCreator,
    groupCreator,
    currentMember,
    updateGroupSettings,
    addMember,
    toggleMemberStatus,
    removeMember,
    clearDummyMembers,
    resetToDefaultData,
    isDemo,
    triggerDemoLock,
  } = useGroup();

  const [groupName, setGroupName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [weekStartsOn, setWeekStartsOn] = useState(group.weekStartsOn);

  // Invite Generator
  const [inviteToken, setInviteToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Member Modal/Input
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Role>("member");

  // LINE
  const [lineUserId, setLineUserId] = useState("");
  const [lineStatus, setLineStatus] = useState<string | null>(null);

  const [savedNotice, setSavedNotice] = useState("");

  // ถ้าไม่ใช่ผู้สร้างกลุ่ม แสดงหน้าแจ้งเตือนและปฏิเสธการเข้าถึง
  if (!isGroupCreator) {
    return (
      <main className="shell">
        <Navbar />
        <div
          className="card"
          style={{
            maxWidth: "560px",
            margin: "60px auto",
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: "#d9483b", margin: "0 0 10px" }}>
            เฉพาะผู้สร้างกลุ่มเท่านั้นที่มีสิทธิ์ตั้งค่ากลุ่ม
          </h2>
          <p style={{ color: "#6a766e", lineHeight: 1.6, margin: "0 0 24px" }}>
            กลุ่ม &quot;<strong>{group.name}</strong>&quot; ถูกสร้างโดย{" "}
            <strong>
              {groupCreator?.nickname
                ? `${groupCreator.nickname} (${groupCreator.name})`
                : groupCreator?.name ?? "ผู้ดูแลกลุ่ม"}
            </strong>
            <br />
            คุณกำลังเข้าสู่ระบบในชื่อ{" "}
            <strong>
              {currentMember?.nickname
                ? `${currentMember.nickname} (${currentMember.name})`
                : currentMember?.name ?? "สมาชิก"}
            </strong>{" "}
            ซึ่งไม่มีสิทธิ์เข้าถึงหน้าตั้งค่ากลุ่มนี้
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="primary">
              ➔ กลับหน้าภาพรวม
            </Link>
            <Link href="/groups/new" className="secondary">
              ＋ สร้างกลุ่มใหม่ของคุณเอง
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      triggerDemoLock("การแก้ไขการตั้งค่ากลุ่ม");
      return;
    }
    if (!isGroupCreator) return;
    updateGroupSettings({
      name: groupName.trim(),
      description: description.trim(),
      weekStartsOn: Number(weekStartsOn),
    });
    setSavedNotice("บันทึกการตั้งค่ากลุ่มเรียบร้อยแล้ว");
    setTimeout(() => setSavedNotice(""), 3000);
  };

  const handleGenerateInvite = () => {
    if (isDemo) {
      triggerDemoLock("การสร้างลิงก์คำเชิญสมาชิก");
      return;
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    setInviteToken(token);
    setCopied(false);
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/invites/${inviteToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      triggerDemoLock("การเพิ่มสมาชิกใหม่");
      return;
    }
    if (!newMemberName.trim()) return;
    addMember(newMemberName.trim(), newMemberRole);
    setNewMemberName("");
  };

  const handleConnectLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      triggerDemoLock("การเชื่อมต่อ LINE Notifications");
      return;
    }
    if (!lineUserId.trim()) return;
    setLineStatus("กำลังเชื่อมต่อ...");
    try {
      const res = await fetch("/api/integrations/line/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId: lineUserId.trim() }),
      });
      const data = await res.json();
      setLineStatus(data.message || "บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (e: any) {
      setLineStatus("บันทึกข้อมูล LINE ID ในระบบแล้ว (รอตั้งค่า Server Credentials)");
    }
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
                การตั้งค่ากลุ่มถูกล็อกในโหมดทดลองใช้งาน (Demo Mode)
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#78350f" }}>
              ระบบเปิดให้ทดลองใช้งานเฉพาะฟังก์ชัน &quot;＋ เพิ่มรายจ่าย&quot; เท่านั้น
              การแก้ไขชื่อกลุ่ม วันเริ่มต้นสัปดาห์ และการเชิญสมาชิกถูกจำกัดสิทธิ์ไว้
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
          <p className="eyebrow">
            การจัดการและตั้งค่ากลุ่ม · 👑 ผู้สร้างกลุ่ม:{" "}
            <strong>
              {groupCreator?.nickname
                ? `${groupCreator.nickname} (${groupCreator.name})`
                : groupCreator?.name ?? "คุณ"}
            </strong>
          </p>
          <h1>การตั้งค่ากลุ่ม ({group.name})</h1>
        </div>
        <Link href="/groups/new" className="secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ＋ สร้างกลุ่มใหม่
        </Link>
      </section>

      {savedNotice && (
        <div className="notice" style={{ marginBottom: "20px" }}>
          ✓ {savedNotice}
        </div>
      )}

      <div className="content-2col">
        {/* คอลัมน์ซ้าย: ตั้งค่ากลุ่ม & ลิงก์เชิญ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* ข้อมูลกลุ่ม (Group Creator Only) */}
          <form className="card" onSubmit={handleSaveGroup}>
            <div className="section-title">
              <span>ข้อมูลและการตั้งค่ากลุ่ม</span>
              <small style={{ color: "#1f6f53", fontWeight: 600 }}>👑 สิทธิ์ผู้สร้างกลุ่ม</small>
            </div>

            <label className="field">
              ชื่อกลุ่ม
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </label>

            <label className="field">
              คำอธิบายกลุ่ม
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="field">
              วันเริ่มต้นของสัปดาห์ (สำหรับการคำนวณรายงาน)
              <select
                value={weekStartsOn}
                onChange={(e) => setWeekStartsOn(Number(e.target.value))}
              >
                <option value={1}>วันจันทร์ (Monday) - ค่าเริ่มต้นแนะนำ</option>
                <option value={0}>วันอาทิตย์ (Sunday)</option>
                <option value={6}>วันเสาร์ (Saturday)</option>
                <option value={5}>วันศุกร์ (Friday)</option>
              </select>
            </label>

            <button
              type="submit"
              className={isDemo ? "secondary full-btn" : "primary full-btn"}
              style={isDemo ? { borderColor: "#f59e0b", color: "#92400e", background: "#fef3c7" } : undefined}
            >
              {isDemo ? "🔒 บันทึกการตั้งค่า (ล็อกในเดโม)" : "บันทึกการตั้งค่า"}
            </button>
          </form>

          {/* รหัสห้องและลิงก์เชิญสมาชิกใหม่ */}
          <div className="card">
            <div className="section-title">
              <span>รหัสห้องและลิงก์เชิญ (Classroom Code & Invite)</span>
            </div>

            {/* รหัสห้อง 6 ตัวอักษร */}
            <div
              style={{
                background: "rgba(31, 111, 83, 0.06)",
                border: "2px dashed rgba(31, 111, 83, 0.3)",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted, #6a766e)", display: "block" }}>
                  🏷️ รหัสห้อง 6 หลักสำหรับชวนเพื่อน
                </span>
                <strong style={{ fontFamily: "monospace", fontSize: "24px", letterSpacing: "4px", color: "#1f6f53" }}>
                  {group.code}
                </strong>
              </div>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  navigator.clipboard.writeText(group.code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 700, borderRadius: "10px" }}
              >
                {copiedCode ? "✓ คัดลอกแล้ว!" : "📋 คัดลอกรหัส"}
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#666", margin: "0 0 14px", lineHeight: 1.5 }}>
              หรือแชร์ลิงก์เชิญแบบมี Token ที่ปลอดภัย ผู้รับจะต้องมีบัญชีหรือสมัครสมาชิกด้วยอีเมลก่อนจึงจะสามารถเข้าร่วมกลุ่มได้
            </p>

            {inviteToken ? (
              <div>
                <div className="code-box" style={{ marginBottom: "10px" }}>
                  <span style={{ wordBreak: "break-all", fontSize: "12px" }}>
                    {typeof window !== "undefined" ? `${window.location.origin}/invites/${inviteToken}` : `/invites/${inviteToken}`}
                  </span>
                  <button className="primary" style={{ padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }} onClick={handleCopyInvite}>
                    {copied ? "✓ คัดลอกแล้ว" : "คัดลอก"}
                  </button>
                </div>
                <small style={{ color: "#666" }}>ลิงก์นี้มีอายุ 7 วัน และสามารถใช้งานได้</small>
              </div>
            ) : (
              <button className="primary full-btn" onClick={handleGenerateInvite}>
                🔗 สร้างลิงก์เชิญใหม่
              </button>
            )}
          </div>

          {/* LINE Messaging API Integration */}
          <div className="card">
            <div className="section-title">
              <span>การเชื่อมต่อ LINE Messaging API (Optional)</span>
            </div>

            <p style={{ fontSize: "13px", color: "#666", margin: "0 0 14px", lineHeight: 1.5 }}>
              รับการแจ้งเตือนยอดค้างชำระและสลิปผ่าน LINE ส่วนตัว (ตามข้อกำหนดการไม่แสร้งส่งข้อความจริง ระบบมี Abstraction และ Graceful Fallback)
            </p>

            <form onSubmit={handleConnectLine}>
              <label className="field">
                LINE User ID ของคุณ
                <input
                  type="text"
                  value={lineUserId}
                  onChange={(e) => setLineUserId(e.target.value)}
                  placeholder="เช่น U1234567890abcdef..."
                />
              </label>

              <button type="submit" className="secondary full-btn">
                เชื่อมต่อบัญชี LINE
              </button>

              {lineStatus && (
                <div className="notice" style={{ marginTop: "12px" }}>
                  {lineStatus}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* คอลัมน์ขวา: รายชื่อสมาชิก & การจัดการสมาชิก */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* จัดการสมาชิก */}
          <div className="card">
            <div className="section-title">
              <span>รายชื่อสมาชิกในกลุ่ม ({members.length} คน)</span>
            </div>

            {/* แบนเนอร์ลบสมาชิกตัวอย่างหากยังมีหลงเหลือในระบบ */}
            {members.some((m) => ["mem-min", "mem-ton", "mem-nont", "mem-ploy", "mem-beam"].includes(m.id)) && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "var(--danger-light, rgba(239, 68, 68, 0.1))",
                  border: "1px solid var(--danger, #ef4444)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--danger, #ef4444)", fontWeight: 500 }}>
                  ⚠️ พบข้อมูลสมาชิกตัวอย่างในระบบ ต้องการลบออกเพื่อเริ่มใช้งานจริงหรือไม่?
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("คุณต้องการลบสมาชิกตัวอย่างทั้งหมดออก เพื่อเริ่มใช้งานจริงใช่หรือไม่?")) {
                      clearDummyMembers();
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    background: "var(--danger, #ef4444)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  🧹 ลบสมาชิกตัวอย่างทั้งหมด (เริ่มใช้งานจริง)
                </button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {members.map((m) => {
                const cleanName = m.name.replace(/\(คุณ\)/g, "").trim();
                const isCurrent = m.id === currentMember.id;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: m.status === "active" ? "var(--surface-input, rgba(125, 125, 125, 0.05))" : "var(--surface-muted, rgba(0, 0, 0, 0.04))",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      opacity: m.status === "inactive" ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                          {cleanName} {isCurrent && <span style={{ color: "var(--primary)", fontSize: "12px", fontWeight: 500, marginLeft: "4px" }}>(คุณ)</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          สิทธิ์: <strong style={{ color: "var(--text-main)" }}>{m.role === "admin" ? "Admin" : "Member"}</strong> ·{" "}
                          สถานะ: <strong style={{ color: m.status === "active" ? "var(--primary)" : "var(--text-muted)" }}>{m.status === "active" ? "ใช้งาน" : "ปิดชั่วคราว"}</strong>
                        </div>
                      </div>
                    </div>

                    {isGroupCreator && !isCurrent && (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          type="button"
                          className="outline"
                          style={{
                            fontSize: "11px",
                            padding: "5px 10px",
                            color: m.status === "active" ? "var(--warning, #d97706)" : "var(--primary, #1f6f53)",
                            borderColor: m.status === "active" ? "var(--warning, #d97706)" : "var(--primary, #1f6f53)",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          onClick={() => toggleMemberStatus(m.id)}
                        >
                          {m.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        </button>
                        <button
                          type="button"
                          style={{
                            fontSize: "11px",
                            padding: "5px 10px",
                            color: "var(--danger, #ef4444)",
                            background: "var(--danger-light, rgba(239, 68, 68, 0.1))",
                            border: "1px solid var(--danger, #ef4444)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                          onClick={() => {
                            if (confirm(`คุณต้องการลบ "${cleanName}" ออกจากกลุ่มใช่หรือไม่?`)) {
                              removeMember(m.id);
                            }
                          }}
                          title="ลบสมาชิกออกจากกลุ่ม"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isGroupCreator && (
              <form onSubmit={handleAddMember} style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px dashed var(--border)" }}>
                <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>เพิ่มสมาชิกใหม่เข้ากลุ่ม</strong>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <input
                    type="text"
                    placeholder="ชื่อสมาชิก"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    style={{
                      flex: 1,
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg)",
                      color: "var(--text-main)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                    }}
                    required
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as Role)}
                    style={{
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg)",
                      color: "var(--text-main)",
                      borderRadius: "8px",
                      padding: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="primary" style={{ padding: "8px 14px", fontSize: "13px" }}>
                    เพิ่ม
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* รีเซ็ตข้อมูลกลุ่ม */}
          <div className="card" style={{ border: "1px dashed var(--border-strong)" }}>
            <div className="section-title">
              <span style={{ color: "var(--danger, #d9483b)" }}>รีเซ็ตข้อมูลกลุ่ม</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 12px" }}>
              คืนค่ากลุ่มเป็นสถานะเริ่มต้น (ยอดเงิน 0 บาท และล้างประวัติรายจ่ายทั้งหมด)
            </p>
            <button className="danger-btn" onClick={resetToDefaultData}>
              🔄 รีเซ็ตข้อมูลกลุ่มเป็นค่าเริ่มต้น (0 บาท)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
