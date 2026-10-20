"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";
import { PasswordInput } from "@/components/PasswordInput";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { members, registerMember, login } = useGroup();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [existingUser, setExistingUser] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExistingUser(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("กรุณาระบุอีเมลที่ถูกต้อง (เช่น yourname@gmail.com)");
      return;
    }

    if (!cleanName) {
      setError("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    // ตรวจสอบอีเมลซ้ำในระบบ
    const duplicate = members.find(
      (m) => m.email && m.email.toLowerCase() === cleanEmail
    );
    if (duplicate) {
      setExistingUser(true);
      setError(`อีเมล "${cleanEmail}" มีผู้ใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบด้วยอีเมลนี้`);
      return;
    }

    if (!password || password.length < 4) {
      setError("รหัสผ่านควรมีความยาวอย่างน้อย 4 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const newMember = registerMember({
        name: cleanName,
        nickname: nickname.trim() || cleanName.split(" ")[0],
        email: cleanEmail,
        password: password.trim(),
        role: "member",
      });

      // เข้าสู่ระบบให้อัตโนมัติทันที
      login(newMember.id);
      const redirectUrl = searchParams.get("redirect") || "/";
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell">
      <div style={{ maxWidth: "500px", margin: "40px auto" }} className="card">
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Link href="/" className="brand" style={{ justifyContent: "center", fontSize: "32px" }}>
            หาร<i>กัน</i>
          </Link>
          <p style={{ color: "var(--text-muted, #6a766e)", fontSize: "14px", marginTop: "6px" }}>
            ระบบจัดการค่าใช้จ่ายกลุ่ม (Group Expense Manager)
          </p>
          <h2 style={{ fontSize: "20px", margin: "14px 0 0" }}>สร้างบัญชีผู้ใช้ด้วยอีเมล</h2>
          <p style={{ color: "var(--text-muted, #6a766e)", fontSize: "13px", margin: "6px 0 0" }}>
            สมัครสมาชิกเพื่อเริ่มหารค่าใช้จ่ายและเคลียร์เงินในกลุ่ม
          </p>
        </div>

        {searchParams.get("redirect") && (
          <div
            style={{
              background: "#eff6ff",
              color: "#1e40af",
              border: "1px solid #bfdbfe",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>🔗</span>
            <span>คุณได้รับคำเชิญเข้าร่วมกลุ่ม กรุณาสมัครสมาชิกก่อน เมื่อสมัครเสร็จระบบจะนำคุณกลับไปตอบรับคำเชิญทันที</span>
          </div>
        )}

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
                {existingUser && (
                  <div style={{ marginTop: "8px" }}>
                    <Link
                      href={`/login?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                      className="primary"
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        textDecoration: "none",
                      }}
                    >
                      ➔ ไปหน้าเข้าสู่ระบบด้วยอีเมลนี้
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: "20px" }}>
            {/* อีเมลจริง */}
            <label className="field">
              <span>อีเมลจริงสำหรับเข้าใช้งาน (Email) <span style={{ color: "#d9483b" }}>*</span></span>
              <input
                type="email"
                placeholder="เช่น yourname@gmail.com หรือ somchai@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (existingUser) setExistingUser(false);
                }}
                required
                autoFocus
                autoComplete="email"
              />
            </label>

            {/* ชื่อและชื่อเล่น */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                <span>ชื่อ-นามสกุล <span style={{ color: "#d9483b" }}>*</span></span>
                <input
                  type="text"
                  placeholder="เช่น สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>

              <label className="field">
                <span>ชื่อเล่น (แสดงในกลุ่ม)</span>
                <input
                  type="text"
                  placeholder="เช่น ชาย, โต้ง"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </label>
            </div>

            {/* รหัสผ่านและยืนยัน */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                <span>รหัสผ่าน <span style={{ color: "#d9483b" }}>*</span></span>
                <PasswordInput
                  placeholder="อย่างน้อย 4 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </label>

              <label className="field">
                <span>ยืนยันรหัสผ่าน <span style={{ color: "#d9483b" }}>*</span></span>
                <PasswordInput
                  placeholder="พิมพ์ให้ตรงกัน"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </label>
            </div>
          </div>

          {/* กล่องคำแนะนำ */}
          <div
            style={{
              marginBottom: "22px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(31, 111, 83, 0.05)",
              border: "1px dashed rgba(31, 111, 83, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "20px", lineHeight: 1 }}>💳</span>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #55645c)", lineHeight: 1.5 }}>
              คุณสามารถเพิ่มเลขบัญชีธนาคาร พร้อมเพย์ หรือรูป QR Code รับเงินได้ในหน้า <strong>&quot;โปรไฟล์&quot;</strong> ภายหลังเข้าสู่ระบบ
            </div>
          </div>

          <button
            type="submit"
            className="primary full-btn"
            disabled={loading}
            style={{ padding: "12px", fontWeight: 700, fontSize: "15px" }}
          >
            {loading ? "กำลังสร้างบัญชี..." : "✓ สมัครสมาชิกและเข้าสู่ระบบทันที"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "13px" }}>
          มีบัญชีผู้ใช้อยู่แล้ว?{" "}
          <Link
            href={
              searchParams.get("redirect")
                ? `/login?redirect=${encodeURIComponent(searchParams.get("redirect")!)}`
                : "/login"
            }
            className="link"
            style={{ fontWeight: 700 }}
          >
            เข้าสู่ระบบด้วยอีเมลที่นี่ ➔
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: "14px" }}>
          <Link href="/" className="link" style={{ fontSize: "13px" }}>
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <div className="card" style={{ maxWidth: "500px", margin: "40px auto", textAlign: "center", padding: "40px" }}>
            กำลังโหลด...
          </div>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
