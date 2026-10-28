"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGroup } from "@/lib/group-context";
import { Navbar } from "@/components/Navbar";

const THAI_BANKS = [
  "กสิกรไทย (KBANK)",
  "ไทยพาณิชย์ (SCB)",
  "กรุงเทพ (BBL)",
  "กรุงไทย (KTB)",
  "กรุงศรีอยุธยา (BAY)",
  "ทหารไทยธนชาต (ttb)",
  "ออมสิน (GSB)",
  "ธ.ก.ส. (BAAC)",
  "เกียรตินาคินภัทร (KKP)",
  "ซีไอเอ็มบี ไทย (CIMBT)",
  "ยูโอบี (UOB)",
  "ทิสโก้ (TISCO)",
  "พร้อมเพย์ (PromptPay)",
  "อื่น ๆ",
];

const PRESET_AVATAR_COLORS = [
  "#1f6f53",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#e67e22",
  "#d35400",
  "#e74c3c",
  "#16a085",
  "#2c3e50",
];

export default function ProfilePage() {
  const router = useRouter();
  const {
    group,
    isGroupCreator,
    currentMember,
    currentMemberId,
    updateProfile,
    isAuthenticated,
    isDemo,
    triggerDemoLock,
  } = useGroup();

  // Profile Fields
  const [name, setName] = useState(currentMember?.name || "");
  const [nickname, setNickname] = useState(currentMember?.nickname || "");
  const [email, setEmail] = useState(currentMember?.email || "");
  const [avatarUrl, setAvatarUrl] = useState<string>(currentMember?.avatarUrl || "");
  const [avatarColor, setAvatarColor] = useState<string>(currentMember?.avatarColor || "#1f6f53");

  // Optional Password Change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Bank & Payment
  const [bankName, setBankName] = useState(currentMember?.bankName || THAI_BANKS[0]);
  const [bankAccountNumber, setBankAccountNumber] = useState(currentMember?.bankAccountNumber || "");
  const [promptpayNumber, setPromptpayNumber] = useState(currentMember?.promptpayNumber || "");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(currentMember?.qrCodeUrl || "");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // ซิงค์ค่าฟอร์มเฉพาะเมื่อโหลดหน้าครั้งแรก หรือเปลี่ยน ID ผู้ใช้ (ป้องกันการรีเซ็ตฟอร์มขณะเลือกธนาคารหรือพิมพ์)
  const initializedMemberIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentMember && initializedMemberIdRef.current !== currentMember.id) {
      initializedMemberIdRef.current = currentMember.id;
      setName(currentMember.name || "");
      setNickname(currentMember.nickname || "");
      setEmail(currentMember.email || "");
      setAvatarUrl(currentMember.avatarUrl || "");
      setAvatarColor(currentMember.avatarColor || "#1f6f53");
      setBankName(currentMember.bankName || THAI_BANKS[0]);
      setBankAccountNumber(currentMember.bankAccountNumber || "");
      setPromptpayNumber(currentMember.promptpayNumber || "");
      setQrCodeUrl(currentMember.qrCodeUrl || "");
    }
  }, [currentMember, currentMemberId]);

  if (!isAuthenticated) {
    return (
      <main className="shell">
        <Navbar />
        <div className="card" style={{ maxWidth: "480px", margin: "40px auto", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>
          <h2>กรุณาเข้าสู่ระบบก่อนจัดการโปรไฟล์</h2>
          <p style={{ color: "var(--text-muted)", margin: "10px 0 20px" }}>
            คุณต้องเข้าสู่ระบบเพื่อแก้ไขข้อมูลส่วนตัว อัปโหลดรูปโปรไฟล์ และบัญชีรับเงิน
          </p>
          <Link href="/login" className="primary">
            ➔ ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </main>
    );
  }

  // อัปโหลดรูปภาพโปรไฟล์ (Avatar)
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP) สำหรับรูปโปรไฟล์");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // อัปโหลดรูป QR Code พร้อมเพย์
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP) สำหรับ QR Code");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setQrCodeUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      triggerDemoLock("การแก้ไขข้อมูลโปรไฟล์และบัญชีธนาคาร");
      return;
    }
    setError("");

    if (!name.trim()) {
      setError("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่กับยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    updateProfile(currentMemberId, {
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      email: email.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      avatarColor,
      password: newPassword.trim() ? newPassword.trim() : undefined,
      bankName,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      promptpayNumber: promptpayNumber.trim() || undefined,
      qrCodeUrl: qrCodeUrl || undefined,
    });

    setNewPassword("");
    setConfirmPassword("");
    setNotice("✓ บันทึกข้อมูลและบัญชีธนาคารเรียบร้อยแล้ว");
    setTimeout(() => setNotice(""), 3500);
  };

  const displayName = nickname ? `${nickname} (${name})` : name || "ชื่อผู้ใช้";
  const initialLetter = (nickname || name || "U").slice(0, 1);

  return (
    <main className="shell">
      <Navbar />

      {isDemo && (
        <div
          style={{
            background: "var(--warning-light, #fef3c7)",
            border: "2px solid var(--warning, #f59e0b)",
            color: "var(--warning, #92400e)",
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
                การแก้ไขโปรไฟล์ถูกล็อกในโหมดทดลองใช้งาน (Demo Mode)
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px" }}>
              ในโหมดทดลองใช้งาน ระบบเปิดให้ทดลองเฉพาะฟังก์ชัน &quot;＋ เพิ่มรายจ่าย&quot; เท่านั้น
              ข้อมูลโปรไฟล์และบัญชีรับเงินถูกล็อกไว้สำหรับตัวอย่างการใช้งาน
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
          <p className="eyebrow">บัญชีผู้ใช้ส่วนตัว · กลุ่ม: {group.name}</p>
          <h1>ตั้งค่าโปรไฟล์ & ข้อมูลรับเงิน</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/groups/new" className="secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            ＋ สร้างกลุ่มใหม่
          </Link>
          {isGroupCreator && (
            <Link href="/settings" className="secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              ⚙️ ตั้งค่ากลุ่ม
            </Link>
          )}
          <Link href="/" className="secondary">
            ← กลับหน้าหลัก
          </Link>
        </div>
      </section>

      {notice && (
        <div className="notice" style={{ marginBottom: "20px" }}>
          {notice}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "var(--danger-light, #fdf2f2)",
            color: "var(--danger, #c0392b)",
            border: "1px solid var(--danger, #ef4444)",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "16px",
            fontWeight: 500,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="content-2col">
        {/* ฟอร์มแก้ไขข้อมูลโปรไฟล์ */}
        <form className="card" onSubmit={handleSave}>
          <div className="section-title">
            <span>รูปโปรไฟล์และข้อมูลส่วนตัว</span>
            <small style={{ color: isGroupCreator ? "var(--primary)" : "var(--text-muted)", fontWeight: isGroupCreator ? 700 : 400 }}>
              {isGroupCreator ? "👑 ผู้สร้างกลุ่ม (Creator)" : "👤 สมาชิกกลุ่ม (Member)"}
            </small>
          </div>

          {/* ส่วนอัปโหลดรูปโปรไฟล์ (Avatar Uploader) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "18px",
              borderRadius: "14px",
              background: "var(--surface-input, rgba(125, 125, 125, 0.05))",
              border: "1px solid var(--border)",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            {/* วงกลมรูปโปรไฟล์ */}
            <div style={{ position: "relative", width: "88px", height: "88px", flexShrink: 0 }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: avatarColor,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  fontWeight: 700,
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  border: "3px solid var(--primary-light, #e7f2eb)",
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initialLetter
                )}
              </div>

              {/* ปุ่มกล้องบนรูป */}
              <label
                htmlFor="profile-avatar-upload"
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--primary, #1f6f53)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  border: "2px solid var(--card-bg, #ffffff)",
                }}
                title="เปลี่ยนรูปโปรไฟล์"
              >
                📷
              </label>
              <input
                type="file"
                id="profile-avatar-upload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
            </div>

            {/* คำแนะนำและปุ่มจัดการรูป */}
            <div style={{ flex: 1, minWidth: "200px" }}>
              <strong style={{ fontSize: "14px", display: "block", color: "var(--text-main)", marginBottom: "4px" }}>
                รูปภาพโปรไฟล์ของคุณ
              </strong>
              <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                รองรับไฟล์ JPG, PNG หรือ WebP (ขนาดไม่เกิน 5 MB) รูปนี้จะแสดงในกลุ่มและหน้ารายการค่าใช้จ่าย
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <label
                  htmlFor="profile-avatar-upload"
                  className="secondary"
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    borderRadius: "8px",
                  }}
                >
                  📷 {avatarUrl ? "เปลี่ยนรูปโปรไฟล์" : "อัปโหลดรูปโปรไฟล์"}
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      color: "var(--danger, #ef4444)",
                      background: "var(--danger-light, rgba(239, 68, 68, 0.1))",
                      border: "1px solid var(--danger, #ef4444)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    🗑️ ลบรูป (ใช้อักษรแทน)
                  </button>
                )}
              </div>

              {/* เลือกสีพื้นหลังอักษร หากไม่มีรูป */}
              {!avatarUrl && (
                <div style={{ marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    หรือเลือกสีพื้นหลังตัวอักษร:
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {PRESET_AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAvatarColor(color)}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: color,
                          border: avatarColor === color ? "2px solid var(--text-main)" : "2px solid transparent",
                          cursor: "pointer",
                          transform: avatarColor === color ? "scale(1.15)" : "scale(1)",
                          transition: "transform 0.15s ease",
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              ชื่อ-นามสกุล *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="field">
              ชื่อเล่น (สำหรับแสดงในกลุ่ม)
              <input
                type="text"
                placeholder="เช่น กานต์, นนท์, มิน"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            อีเมล
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {/* เปลี่ยนรหัสผ่าน (Optional) */}
          <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>
                🔐 เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
              </strong>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                รหัสผ่านใหม่
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="ความยาว 6 ตัวอักษรขึ้นไป"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label className="field">
                ยืนยันรหัสผ่านใหม่
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px dashed var(--border)" }}>
            <div className="section-title">
              <span>💳 ข้อมูลสำหรับรับเงินโอนจากเพื่อน</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                ธนาคาร
                <select value={bankName} onChange={(e) => setBankName(e.target.value)}>
                  {THAI_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                เลขที่บัญชี
                <input
                  type="text"
                  placeholder="เช่น 123-4-56789-0"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                />
              </label>
            </div>

            <label className="field">
              หมายเลขพร้อมเพย์ (เบอร์โทร หรือ เลขบัตรประชาชน)
              <input
                type="text"
                placeholder="เช่น 0812345678"
                value={promptpayNumber}
                onChange={(e) => setPromptpayNumber(e.target.value)}
              />
            </label>

            {/* อัปโหลด QR Code พร้อมเพย์ */}
            <div className="field">
              <span>อัปโหลดรูปภาพคิวอาร์โค้ดพร้อมเพย์ (PromptPay QR)</span>
              <div
                style={{
                  border: "2px dashed var(--border-strong)",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                  background: "var(--surface-input, rgba(125, 125, 125, 0.05))",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  id="profile-qr-upload"
                  style={{ display: "none" }}
                  onChange={handleQrUpload}
                />
                <label htmlFor="profile-qr-upload" style={{ cursor: "pointer", display: "block" }}>
                  {qrCodeUrl ? (
                    <div>
                      <img
                        src={qrCodeUrl}
                        alt="QR Code Preview"
                        style={{
                          maxWidth: "150px",
                          maxHeight: "150px",
                          borderRadius: "8px",
                          margin: "0 auto 8px",
                          border: "1px solid var(--border)",
                          display: "block",
                        }}
                      />
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>
                        ✓ รูปคิวอาร์โค้ดปัจจุบัน (คลิกเพื่อเปลี่ยนรูป)
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "28px", marginBottom: "4px" }}>📷</div>
                      <span style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600 }}>
                        ＋ คลิกเพื่ออัปโหลดรูป QR Code พร้อมเพย์
                      </span>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                        เพื่อให้เพื่อนสามารถสแกนชำระเงินให้คุณได้สะดวก
                      </p>
                    </div>
                  )}
                </label>

                {qrCodeUrl && (
                  <button
                    type="button"
                    className="danger-btn"
                    style={{ fontSize: "11px", marginTop: "10px", padding: "4px 10px" }}
                    onClick={() => setQrCodeUrl("")}
                  >
                    ลบรูป QR Code
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={isDemo ? "secondary full-btn" : "primary full-btn"}
            style={{
              padding: "12px",
              marginTop: "16px",
              fontSize: "14px",
              fontWeight: 700,
              ...(isDemo ? { borderColor: "var(--warning)", color: "var(--warning)", background: "var(--warning-light)" } : {}),
            }}
          >
            {isDemo ? "🔒 บันทึกข้อมูลโปรไฟล์ (ล็อกในเดโม)" : "✓ บันทึกการแก้ไขโปรไฟล์ทั้งหมด"}
          </button>
        </form>

        {/* Live Preview Card: การ์ดตัวอย่างที่เพื่อนสมาชิกจะเห็นเมื่อต้องโอนเงินให้คุณ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card" style={{ border: "1px solid var(--border)" }}>
            <div className="section-title">
              <span>👁️ ตัวอย่างการ์ดรับเงินของคุณ (Live Preview)</span>
              <small style={{ color: "var(--text-muted)" }}>ที่เพื่อนจะเห็นในหน้าชำระเงิน</small>
            </div>

            <div
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: avatarColor,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "20px",
                    overflow: "hidden",
                    border: "2px solid var(--primary-light, #e7f2eb)",
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initialLetter
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-main)" }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: "12px", color: isGroupCreator ? "var(--primary)" : "var(--text-muted)", fontWeight: isGroupCreator ? 600 : 400 }}>
                    {isGroupCreator ? "👑 ผู้สร้างกลุ่ม (Creator)" : "👤 สมาชิกกลุ่ม"}
                  </div>
                  {email && (
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      ✉️ {email}
                    </div>
                  )}
                </div>
              </div>

              {/* ข้อมูลธนาคาร */}
              <div
                style={{
                  background: "var(--primary-light, rgba(31, 111, 83, 0.08))",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "12px",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700, marginBottom: "4px" }}>
                  บัญชีธนาคาร
                </div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>
                  {bankName || "ยังไม่ระบุธนาคาร"}
                </div>
                <div style={{ fontSize: "15px", fontFamily: "monospace", letterSpacing: "1px", color: "var(--text-main)", marginTop: "2px" }}>
                  {bankAccountNumber || "ยังไม่ระบุเลขบัญชี"}
                </div>
              </div>

              {/* พร้อมเพย์ */}
              {promptpayNumber && (
                <div
                  style={{
                    background: "var(--info-light, rgba(37, 99, 235, 0.08))",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    marginBottom: "12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--info)", fontWeight: 700, marginBottom: "2px" }}>
                    พร้อมเพย์ (PromptPay)
                  </div>
                  <div style={{ fontSize: "14px", fontFamily: "monospace", fontWeight: 600, color: "var(--info)" }}>
                    {promptpayNumber}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {qrCodeUrl ? (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "14px",
                    padding: "14px",
                    background: "var(--surface-input, rgba(125, 125, 125, 0.05))",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                    📷 สแกนคิวอาร์โค้ดเพื่อจ่ายเงิน
                  </div>
                  <img
                    src={qrCodeUrl}
                    alt="PromptPay QR Code"
                    style={{
                      maxWidth: "180px",
                      maxHeight: "180px",
                      borderRadius: "8px",
                      margin: "0 auto",
                      display: "block",
                      border: "1px solid var(--border)",
                      background: "#ffffff",
                      padding: "6px",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    background: "var(--surface-input, rgba(125, 125, 125, 0.05))",
                    borderRadius: "10px",
                    border: "1px dashed var(--border)",
                  }}
                >
                  ยังไม่มีรูปคิวอาร์โค้ด (สามารถอัปโหลดได้ที่ฟอร์มด้านซ้าย)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
