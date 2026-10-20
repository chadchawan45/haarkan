"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";
import { PasswordInput } from "@/components/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { members, login, isAuthenticated, currentMember } = useGroup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notFoundEmail, setNotFoundEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredNotice, setRegisteredNotice] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) {
      setEmail(qEmail);
    }
    if (searchParams.get("registered") === "true") {
      setRegisteredNotice(true);
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotFoundEmail("");
    setLoading(true);

    try {
      const cleanInput = email.trim().toLowerCase();
      if (!cleanInput) {
        setError("กรุณากรอกอีเมลของคุณ");
        return;
      }

      // ค้นหาตามอีเมลจริงเป็นลำดับแรก หรือตามชื่อผู้ใช้/ชื่อเล่น/ID
      const found = members.find(
        (m) =>
          (m.email && m.email.toLowerCase() === cleanInput) ||
          m.name.toLowerCase() === cleanInput ||
          m.nickname?.toLowerCase() === cleanInput ||
          m.id.toLowerCase() === cleanInput
      );

      if (found) {
        if (password && found.password && found.password !== password.trim()) {
          setError("รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง หรือคลิก 'ลืมรหัสผ่าน' เพื่อกู้คืนบัญชี");
          return;
        }
        login(found.id);
        router.push("/");
      } else {
        setNotFoundEmail(cleanInput);
        setError(`ยังไม่พบบัญชีที่ใช้อีเมล "${email.trim()}" ในระบบ`);
      }
    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError("");
    setNotFoundEmail("");
  };

  return (
    <main className="shell">
      <div style={{ maxWidth: "460px", margin: "40px auto" }} className="card">
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Link href="/" className="brand" style={{ justifyContent: "center", fontSize: "32px" }}>
            หาร<i>กัน</i>
          </Link>
          <p style={{ color: "var(--text-muted, #6a766e)", fontSize: "14px", marginTop: "8px" }}>
            ระบบจัดการค่าใช้จ่ายกลุ่ม (Group Expense Manager)
          </p>
          <h2 style={{ fontSize: "20px", margin: "14px 0 0" }}>เข้าสู่ระบบด้วยอีเมล</h2>
          <p style={{ color: "var(--text-muted, #6a766e)", fontSize: "13px", margin: "6px 0 0" }}>
            กรอกอีเมลและรหัสผ่านจริงของคุณเพื่อเข้าใช้งาน
          </p>
        </div>

        {registeredNotice && (
          <div
            style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>✓</span>
            <span>สมัครสมาชิกสำเร็จแล้ว! กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ</span>
          </div>
        )}

        {isAuthenticated && (
          <div className="notice" style={{ marginBottom: "18px" }}>
            คุณกำลังเข้าสู่ระบบอยู่ในชื่อ <strong>{currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name}</strong>
            {currentMember.email && (
              <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                ({currentMember.email})
              </span>
            )}
            <div style={{ marginTop: "8px" }}>
              <Link href="/" className="link" style={{ marginRight: "12px" }}>
                ➔ ไปหน้าภาพรวม
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleEmailLogin}>
          <label className="field">
            <span>อีเมลสำหรับเข้าสู่ระบบ (Email) <span style={{ color: "#d9483b" }}>*</span></span>
            <input
              type="email"
              placeholder="เช่น yourname@gmail.com หรือ somchai@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (notFoundEmail) setNotFoundEmail("");
              }}
              required
              autoFocus
              autoComplete="email"
            />
          </label>

          <label className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>รหัสผ่าน (Password) <span style={{ color: "#d9483b" }}>*</span></span>
              <Link href="/forgot-password" className="link" style={{ fontSize: "12px", fontWeight: 500 }}>
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div
              style={{
                background: "#fdf2f2",
                color: "#c0392b",
                padding: "12px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                marginBottom: "16px",
                border: "1px solid #fecaca",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div>{error}</div>
                  {notFoundEmail && (
                    <div style={{ marginTop: "8px" }}>
                      <Link
                        href={`/register?email=${encodeURIComponent(notFoundEmail)}`}
                        className="primary"
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          textDecoration: "none",
                        }}
                      >
                        ➔ สมัครสมาชิกด้วยอีเมลนี้ทันที
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="primary full-btn"
            disabled={loading}
            style={{ fontWeight: 700, padding: "12px", fontSize: "15px" }}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วยอีเมล"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "13px" }}>
          ยังไม่มีบัญชีผู้ใช้?{" "}
          <Link
            href={email ? `/register?email=${encodeURIComponent(email)}` : "/register"}
            className="link"
            style={{ fontWeight: 700 }}
          >
            สมัครสมาชิกใหม่ด้วยอีเมลที่นี่ ➔
          </Link>
        </div>

        {/* บัญชีระบบสำหรับทดสอบด่วน */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px dashed var(--border, #eef0ed)",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-muted, #777)", display: "block", marginBottom: "8px" }}>
            💡 หรือคลิกเลือกบัญชีระบบเพื่อทดสอบด่วน:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button
              type="button"
              onClick={() => handleQuickFill("karn@haarkan.local", "password123")}
              style={{
                background: "rgba(31, 111, 83, 0.08)",
                border: "1px solid rgba(31, 111, 83, 0.25)",
                color: "#1f6f53",
                borderRadius: "16px",
                padding: "4px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              👤 กานต์ (karn@haarkan.local)
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Link href="/" className="link" style={{ fontSize: "13px" }}>
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <div className="card" style={{ maxWidth: "460px", margin: "40px auto", textAlign: "center", padding: "40px" }}>
            กำลังโหลด...
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
