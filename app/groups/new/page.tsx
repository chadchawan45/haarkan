"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGroup, generateRoomCode } from "@/lib/group-context";
import { Navbar } from "@/components/Navbar";

export default function NewGroupPage() {
  const router = useRouter();
  const {
    currentMember,
    isAuthenticated,
    isDemo,
    triggerDemoLock,
    createGroup,
  } = useGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weekStartsOn, setWeekStartsOn] = useState<number>(1);
  const [roomCode, setRoomCode] = useState<string>(() => generateRoomCode());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ถ้ายังไม่ล็อกอิน
  if (!isAuthenticated) {
    return (
      <main className="shell">
        <Navbar />
        <div
          className="card"
          style={{
            maxWidth: "520px",
            margin: "60px auto",
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
          <h2 style={{ margin: "0 0 10px" }}>กรุณาเข้าสู่ระบบก่อนสร้างกลุ่ม</h2>
          <p style={{ color: "#6a766e", lineHeight: 1.6, margin: "0 0 24px" }}>
            คุณต้องเข้าสู่ระบบเพื่อสร้างกลุ่มและเป็นผู้ดูแลกลุ่ม
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/login" className="primary">
              ➔ เข้าสู่ระบบ
            </Link>
            <Link href="/" className="secondary">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDemo) {
      triggerDemoLock("การสร้างกลุ่มใหม่");
      return;
    }

    if (!name.trim()) return;

    setLoading(true);
    createGroup({
      name: name.trim(),
      description: description.trim(),
      weekStartsOn: Number(weekStartsOn),
      code: roomCode,
    });

    setSuccess(true);
    setLoading(false);
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
                การสร้างกลุ่มใหม่ถูกจำกัดในโหมดทดลองใช้งาน (Demo Mode)
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#78350f" }}>
              โหมดทดลองใช้งานเปิดให้ทดลองใช้เฉพาะฟังก์ชัน &quot;＋ เพิ่มรายจ่าย&quot; เท่านั้น
            </p>
          </div>
          <Link
            href="/expenses/new"
            className="primary"
            style={{ fontWeight: 700, padding: "8px 16px", textDecoration: "none" }}
          >
            ⚡ ไปลองเพิ่มรายจ่าย
          </Link>
        </div>
      )}

      <section className="intro">
        <div>
          <p className="eyebrow">ระบบแชร์ค่าใช้จ่าย · สร้างกลุ่มใหม่</p>
          <h1>＋ สร้างกลุ่มใหม่ (Create Group)</h1>
          <p style={{ color: "#6a766e", marginTop: "6px", fontSize: "14px" }}>
            สร้างกลุ่มใหม่สำหรับแชร์ค่าใช้จ่ายทริป ค่าบ้าน หรือกิจกรรมร่วมกัน โดยคุณจะได้รับสิทธิ์เป็นผู้สร้างกลุ่มและเข้าถึงหน้าตั้งค่ากลุ่ม
          </p>
        </div>
        <Link href="/" className="secondary">
          ← กลับหน้าหลัก
        </Link>
      </section>

      {success && (
        <div
          className="card"
          style={{
            maxWidth: "680px",
            margin: "0 auto 30px",
            background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
            border: "2px solid #86efac",
            borderRadius: "18px",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "10px" }}>🎉</div>
          <h2 style={{ color: "#166534", margin: "0 0 6px", fontSize: "22px" }}>
            สร้างห้อง &quot;{name}&quot; สำเร็จเรียบร้อย!
          </h2>
          <p style={{ color: "#374151", fontSize: "14px", margin: "0 0 20px" }}>
            ส่งรหัสห้อง 6 ตัวนี้ให้เพื่อน เพื่อให้เพื่อนกด <strong>&quot;🔑 เข้าร่วมห้อง&quot;</strong> แล้วกรอกรหัสนี้ได้ทันที
          </p>

          {/* กล่องแสดงรหัสห้องแบบ Classroom */}
          <div
            style={{
              background: "#fff",
              border: "2px dashed #16a34a",
              borderRadius: "16px",
              padding: "20px",
              maxWidth: "380px",
              margin: "0 auto 24px",
              boxShadow: "0 10px 25px rgba(22, 163, 74, 0.12)",
            }}
          >
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "6px" }}>
              🏷️ รหัสห้อง (CLASSROOM CODE)
            </span>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "36px",
                fontWeight: 900,
                letterSpacing: "6px",
                color: "#15803d",
                padding: "8px 0",
              }}
            >
              {roomCode}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px" }}>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2500);
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  borderRadius: "10px",
                }}
              >
                {copiedCode ? "✓ คัดลอกรหัสแล้ว!" : "📋 คัดลอกรหัสห้อง"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const joinUrl = `${window.location.origin}/invites/${roomCode}`;
                  navigator.clipboard.writeText(joinUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "10px",
                }}
              >
                {copiedLink ? "✓ คัดลอกลิงก์แล้ว!" : "🔗 คัดลอกลิงก์ชวน"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link
              href="/"
              className="primary"
              style={{
                padding: "12px 28px",
                fontSize: "15px",
                fontWeight: 700,
                borderRadius: "12px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ➔ เข้าสู่ห้องและเริ่มใช้งาน ({name})
            </Link>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="section-title">
            <span>ข้อมูลกลุ่มใหม่</span>
            <span style={{ fontSize: "12px", color: "#1f6f53", fontWeight: 600 }}>
              👑 คุณเป็นผู้สร้างกลุ่ม
            </span>
          </div>

          <label className="field">
            ชื่อกลุ่ม <span style={{ color: "#d9483b" }}>*</span>
            <input
              type="text"
              placeholder="เช่น ทริปเที่ยวญี่ปุ่น 2026, แชร์ค่าบ้านสุขใจ, แก๊งชาบูวันศุกร์"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              disabled={loading || success}
            />
          </label>

          <label className="field">
            คำอธิบายกลุ่ม (ถ้ามี)
            <textarea
              rows={3}
              placeholder="ระบุจุดประสงค์หรือรายละเอียดกลุ่ม เช่น แชร์ค่าที่พัก ค่าเดินทาง และค่าอาหาร"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading || success}
            />
          </label>

          {/* สุ่มรหัสห้อง 6 ตัวอักษรแบบ Classroom */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(31, 111, 83, 0.08) 0%, rgba(31, 111, 83, 0.02) 100%)",
              border: "2px dashed rgba(31, 111, 83, 0.35)",
              borderRadius: "14px",
              padding: "16px 18px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1f6f53", display: "flex", alignItems: "center", gap: "6px" }}>
                  🏷️ รหัสห้อง 6 หลักสำหรับชวนเพื่อน (Classroom Code)
                </span>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-muted, #6a766e)" }}>
                  ระบบสุ่มรหัส 6 ตัวนี้ให้คุณโดยอัตโนมัติ ส่งรหัสนี้ให้เพื่อนใช้กดปุ่ม <strong>&quot;เข้าร่วมห้อง&quot;</strong>
                </p>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => setRoomCode(generateRoomCode())}
                style={{ padding: "5px 10px", fontSize: "12px", borderRadius: "8px" }}
                disabled={loading || success}
                title="สุ่มรหัสใหม่"
              >
                🔄 สุ่มใหม่
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "24px",
                  fontWeight: 900,
                  letterSpacing: "4px",
                  color: "#1f6f53",
                  background: "#fff",
                  padding: "8px 18px",
                  borderRadius: "10px",
                  border: "1px solid #a7f3d0",
                }}
              >
                {roomCode}
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                style={{ padding: "8px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "8px" }}
              >
                {copiedCode ? "✓ คัดลอกแล้ว!" : "📋 คัดลอกรหัส"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label className="field">
              วันเริ่มต้นรอบสัปดาห์
              <select
                value={weekStartsOn}
                onChange={(e) => setWeekStartsOn(Number(e.target.value))}
                disabled={loading || success}
              >
                <option value={1}>วันจันทร์ (แนะนำ)</option>
                <option value={0}>วันอาทิตย์</option>
              </select>
            </label>

            <label className="field">
              สกุลเงินหลัก
              <input type="text" value="THB (บาทไทย ฿)" disabled style={{ opacity: 0.8 }} />
            </label>
          </div>

          {/* กล่องอธิบายสิทธิ์ความเป็นเจ้าของกลุ่ม */}
          <div
            style={{
              marginTop: "20px",
              padding: "16px 18px",
              borderRadius: "12px",
              background: "rgba(31, 111, 83, 0.06)",
              border: "1px solid rgba(31, 111, 83, 0.18)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>👑</span>
              <strong style={{ fontSize: "14px", color: "#1f6f53" }}>
                สิทธิ์พิเศษสำหรับคุณในฐานะผู้สร้างกลุ่ม
              </strong>
            </div>
            <ul style={{ margin: "4px 0 0 20px", padding: 0, fontSize: "13px", color: "#3a4a40", lineHeight: 1.6 }}>
              <li>
                คุณ (<strong>{currentMember?.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember?.name}</strong>) จะเป็นเจ้าของกลุ่มและได้รับสิทธิ์เข้าถึงหน้า <strong>&quot;⚙️ ตั้งค่ากลุ่ม&quot;</strong>
              </li>
              <li>
                คุณสามารถเปลี่ยนชื่อกลุ่ม จัดการสมาชิก และสร้างลิงก์เชิญเพื่อนเข้าร่วมกลุ่มได้ตลอดเวลา
              </li>
              <li>
                สมาชิกคนอื่นที่เข้าร่วมกลุ่มจะไม่เห็นและไม่สามารถเข้าหน้าตั้งค่ากลุ่มนี้ได้ เพื่อความปลอดภัยและความเป็นระเบียบ
              </li>
            </ul>
          </div>

          <div className="form-actions" style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link href="/" className="secondary" style={{ padding: "10px 18px" }}>
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="primary"
              disabled={loading || success || !name.trim()}
              style={{
                padding: "10px 24px",
                fontWeight: 700,
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {loading ? "กำลังสร้างกลุ่ม..." : "＋ ยืนยันสร้างกลุ่มใหม่"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
