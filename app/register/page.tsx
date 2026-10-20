"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";
import { PasswordInput } from "@/components/PasswordInput";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function RegisterPage() {
  const router = useRouter();
  const { registerMember } = useGroup();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      registerMember({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        email: email.trim() || undefined,
        password: password.trim() || undefined,
        role: "member",
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell">
      <div style={{ maxWidth: "520px", margin: "40px auto" }} className="card">
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Link href="/" className="brand" style={{ justifyContent: "center", fontSize: "32px" }}>
            หาร<i>กัน</i>
          </Link>
          <p style={{ color: "#6a766e", fontSize: "14px", marginTop: "6px" }}>
            สมัครสมาชิกเพื่อร่วมกลุ่มหารค่าใช้จ่ายได้อย่างสะดวกรวดเร็ว
          </p>
          <h2 style={{ fontSize: "20px", margin: "14px 0 0" }}>สร้างบัญชีผู้ใช้ใหม่</h2>
        </div>

        {/* สมัครด่วนด้วย Google */}
        <div style={{ marginBottom: "20px" }}>
          <GoogleLoginButton text="สมัครสมาชิกและเข้าสู่ระบบด้วย Google" />
        </div>

        {/* เส้นคั่นตัวเลือก */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "0 0 20px",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--border, #eef0ed)" }} />
          <span style={{ fontSize: "12px", color: "var(--muted, #6a766e)", fontWeight: 500 }}>
            หรือกรอกข้อมูลสมัครสมาชิก
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border, #eef0ed)" }} />
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

        <form onSubmit={handleRegister}>
          {/* ข้อมูลประจำตัว */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 14px", color: "#1f6f53", fontSize: "15px" }}>
              👤 ข้อมูลประจำตัว
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                ชื่อ-นามสกุล <span style={{ color: "#d9483b" }}>*</span>
                <input
                  type="text"
                  placeholder="เช่น สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <label className="field">
                ชื่อเล่น (สำหรับแสดงในกลุ่ม)
                <input
                  type="text"
                  placeholder="เช่น ชาย, โต้ง"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </label>
            </div>

            <label className="field">
              อีเมล หรือ ชื่อผู้ใช้
              <input
                type="text"
                placeholder="somchai@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                รหัสผ่าน
                <PasswordInput
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <label className="field">
                ยืนยันรหัสผ่าน
                <PasswordInput
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* กล่องข้อความแนะนำการเพิ่มบัญชีรับเงินในภายหลัง */}
          <div
            style={{
              marginBottom: "24px",
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(31, 111, 83, 0.06)",
              border: "1px dashed rgba(31, 111, 83, 0.25)",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "22px", lineHeight: 1 }}>💳</span>
            <div style={{ fontSize: "13px", color: "#3a4a40", lineHeight: 1.5 }}>
              <strong style={{ color: "#1f6f53" }}>ข้อมูลบัญชีธนาคาร & คิวอาร์โค้ดรับเงิน:</strong>
              <p style={{ margin: "4px 0 0", color: "#55645c" }}>
                คุณสามารถเพิ่มเลขที่บัญชีธนาคาร พร้อมเพย์ หรืออัปโหลดรูปภาพ QR Code สำหรับรับเงินโอนจากเพื่อนได้ตลอดเวลาในหน้า{" "}
                <strong style={{ color: "#1f6f53" }}>&quot;ตั้งค่าโปรไฟล์&quot;</strong> หลังจากเข้าสู่ระบบ
              </p>
            </div>
          </div>

          <button type="submit" className="primary full-btn" disabled={loading} style={{ padding: "12px", fontWeight: 700 }}>
            {loading ? "กำลังสร้างบัญชี..." : "✓ สมัครสมาชิกและเข้าใช้งานทันที"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="link" style={{ fontWeight: 600 }}>
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </main>
  );
}
