"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGroup, Member } from "@/lib/group-context";
import { PasswordInput } from "@/components/PasswordInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { members, findMemberByIdentifier, resetPassword, login } = useGroup();

  const [identifier, setIdentifier] = useState("");
  const [targetMember, setTargetMember] = useState<Member | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState<"search" | "reset" | "done">("search");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ขั้นตอนที่ 1: ตรวจสอบหาบัญชีผู้ใช้ในระบบ
  const handleSearchAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("กรุณาระบุเบอร์โทรศัพท์ อีเมล หรือชื่อผู้ใช้ของคุณ");
      return;
    }

    setLoading(true);
    const found = findMemberByIdentifier(identifier.trim());
    setLoading(false);

    if (found) {
      setTargetMember(found);
      setStep("reset");
    } else {
      setError("ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบเบอร์โทรศัพท์ อีเมล หรือสมัครสมาชิกใหม่");
    }
  };

  // ขั้นตอนที่ 2: ตั้งรหัสผ่านใหม่
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword.trim()) {
      setError("กรุณาระบุรหัสผ่านใหม่");
      return;
    }

    if (newPassword.length < 4) {
      setError("รหัสผ่านควรมีความยาวอย่างน้อย 4 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!targetMember) return;

    setLoading(true);
    const res = resetPassword(targetMember.id, newPassword.trim());
    setLoading(false);

    if (res.success) {
      setStep("done");
    } else {
      setError(res.message);
    }
  };

  const handleLoginImmediately = () => {
    if (targetMember) {
      login(targetMember.id);
      router.push("/");
    } else {
      router.push("/login");
    }
  };

  return (
    <main className="shell">
      <div style={{ maxWidth: "480px", margin: "40px auto" }} className="card">
        {/* หัวข้อหน้า */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Link href="/" className="brand" style={{ justifyContent: "center", fontSize: "32px" }}>
            หาร<i>กัน</i>
          </Link>
          <p style={{ color: "#6a766e", fontSize: "14px", marginTop: "6px" }}>
            ระบบจัดการค่าใช้จ่ายกลุ่ม (Group Expense Manager)
          </p>
          <h2 style={{ fontSize: "20px", margin: "14px 0 0" }}>
            🔑 กู้คืนบัญชีผู้ใช้ (Forgot Password)
          </h2>
        </div>

        {error && (
          <div
            style={{
              background: "#fdf2f2",
              color: "#c0392b",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ขั้นตอนที่ 1: ค้นหาบัญชี */}
        {step === "search" && (
          <form onSubmit={handleSearchAccount}>
            <p style={{ fontSize: "14px", color: "#55645c", lineHeight: 1.6, margin: "0 0 16px" }}>
              กรุณาระบุ <strong>เบอร์โทรศัพท์</strong>, <strong>อีเมล</strong>, <strong>ชื่อเล่น</strong> หรือ <strong>ชื่อ-นามสกุล</strong> ที่ใช้ลงทะเบียน เพื่อค้นหาและยืนยันบัญชีของคุณ
            </p>

            <label className="field">
              เบอร์โทรศัพท์, อีเมล หรือ ชื่อผู้ใช้
              <input
                type="text"
                placeholder="เช่น 081-234-5678 หรือ yourname@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
                required
              />
            </label>

            <button type="submit" className="primary full-btn" disabled={loading} style={{ padding: "12px", fontWeight: 700, marginTop: "16px" }}>
              {loading ? "กำลังตรวจสอบ..." : "➔ ค้นหาและตรวจสอบบัญชี"}
            </button>
          </form>
        )}

        {/* ขั้นตอนที่ 2: พบบัญชีแล้ว -> ตั้งรหัสผ่านใหม่ */}
        {step === "reset" && targetMember && (
          <form onSubmit={handleResetPassword}>
            {/* กล่องแสดงข้อมูลบัญชีที่พบ */}
            <div
              style={{
                marginBottom: "20px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "rgba(31, 111, 83, 0.06)",
                border: "1px solid rgba(31, 111, 83, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: targetMember.avatarColor,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {(targetMember.nickname || targetMember.name).slice(0, 1)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong style={{ fontSize: "15px" }}>
                    {targetMember.nickname ? `${targetMember.nickname} (${targetMember.name})` : targetMember.name}
                  </strong>
                  <span
                    style={{
                      fontSize: "11px",
                      background: "#dcfce7",
                      color: "#166534",
                      padding: "2px 6px",
                      borderRadius: "99px",
                      fontWeight: 600,
                    }}
                  >
                    ✓ พบบัญชีในระบบ
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                  {targetMember.phone ? `เบอร์โทรศัพท์: ${targetMember.phone}` : targetMember.email ? `อีเมล: ${targetMember.email}` : "ผู้ใช้ในระบบ"}
                </div>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#55645c", margin: "0 0 16px" }}>
              ตั้งรหัสผ่านใหม่สำหรับบัญชีนี้ (มีปุ่ม 👁️ แสดง/ซ่อนรหัสผ่าน เพื่อตรวจสอบความถูกต้อง):
            </p>

            <label className="field">
              รหัสผ่านใหม่ <span style={{ color: "#d9483b" }}>*</span>
              <PasswordInput
                placeholder="ระบุรหัสผ่านใหม่ที่ต้องการ"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="field">
              ยืนยันรหัสผ่านใหม่อีกครั้ง <span style={{ color: "#d9483b" }}>*</span>
              <PasswordInput
                placeholder="พิมพ์รหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setStep("search");
                  setError("");
                }}
                style={{ flex: 1, padding: "10px" }}
              >
                ← ค้นหาบัญชีอื่น
              </button>
              <button
                type="submit"
                className="primary"
                disabled={loading || !newPassword}
                style={{ flex: 2, padding: "10px", fontWeight: 700 }}
              >
                {loading ? "กำลังบันทึก..." : "✓ บันทึกรหัสผ่านใหม่"}
              </button>
            </div>
          </form>
        )}

        {/* ขั้นตอนที่ 3: สำเร็จ */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: "52px", marginBottom: "14px" }}>🎉</div>
            <h3 style={{ color: "#1f6f53", margin: "0 0 8px", fontSize: "18px" }}>
              กู้คืนบัญชีและตั้งรหัสผ่านใหม่สำเร็จ!
            </h3>
            <p style={{ color: "#55645c", fontSize: "14px", lineHeight: 1.6, margin: "0 0 24px" }}>
              รหัสผ่านใหม่ของคุณได้รับการอัปเดตเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบและเริ่มใช้งานได้ทันที
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={handleLoginImmediately}
                className="primary full-btn"
                style={{ padding: "12px", fontWeight: 700 }}
              >
                ➔ เข้าสู่ระบบในชื่อ {targetMember?.nickname || targetMember?.name} ทันที
              </button>
              <Link href="/login" className="secondary full-btn" style={{ padding: "10px", textAlign: "center" }}>
                ไปหน้าแบบฟอร์มเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid #eef0ed", marginTop: "24px", paddingTop: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "#666", display: "flex", justifyContent: "center", gap: "16px" }}>
            <Link href="/login" className="link" style={{ fontWeight: 600 }}>
              ← กลับหน้าเข้าสู่ระบบ
            </Link>
            <span>·</span>
            <Link href="/register" className="link">
              สมัครสมาชิกใหม่
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
