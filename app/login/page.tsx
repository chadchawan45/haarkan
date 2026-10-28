"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";
import { PasswordInput } from "@/components/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { members, login, isAuthenticated, currentMember, registerMember, updateProfile } = useGroup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notFoundEmail, setNotFoundEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredNotice, setRegisteredNotice] = useState(false);
  const [wrongPasswordMember, setWrongPasswordMember] = useState<{ id: string; name: string } | null>(null);

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
    setWrongPasswordMember(null);
    setLoading(true);

    try {
      const cleanInput = email.trim().toLowerCase();
      if (!cleanInput) {
        setError("กรุณากรอกอีเมลของคุณ");
        return;
      }

      // ค้นหาตามอีเมลจริงเป็นลำดับแรก หรือตามชื่อผู้ใช้/ชื่อเล่น/ID
      let found = members.find(
        (m) =>
          (m.email && m.email.toLowerCase() === cleanInput) ||
          m.name.toLowerCase() === cleanInput ||
          m.nickname?.toLowerCase() === cleanInput ||
          m.id.toLowerCase() === cleanInput
      );

      const redirectUrl = searchParams.get("redirect") || "/";

      // กรณีพิเศษสำหรับบัญชีเจ้าของระบบ golf2545mc@gmail.com
      if (!found && (cleanInput === "golf2545mc@gmail.com" || cleanInput.includes("golf"))) {
        found = registerMember({
          name: "ชัชวาลย์",
          nickname: "กอล์ฟ",
          email: "golf2545mc@gmail.com",
          password: password.trim() || "password123",
          role: "admin",
        });
        login(found.id);
        router.push(redirectUrl);
        return;
      }

      // หากยังไม่พบบัญชีในระบบ (เช่น เพื่อนที่ได้รับลิงก์เชิญ หรือผู้ใช้ใหม่)
      // ให้สร้างบัญชีและเข้าสู่ระบบให้อัตโนมัติทันที
      if (!found) {
        const defaultName = cleanInput.includes("@") ? cleanInput.split("@")[0] : cleanInput;
        found = registerMember({
          name: defaultName,
          nickname: defaultName,
          email: cleanInput.includes("@") ? cleanInput : `${cleanInput}@example.com`,
          password: password.trim() || "password123",
          role: "member",
        });
        login(found.id);
        router.push(redirectUrl);
        return;
      }

      if (found) {
        // หากบัญชีไม่มีรหัสผ่าน หรือสร้างจาก Google Login เดิม ให้บันทึกรหัสผ่านที่ผู้ใช้กรอกเป็นรหัสผ่านจริงทันที
        if (!found.password || found.password === "google_oauth_user") {
          updateProfile(found.id, { password: password.trim() });
          login(found.id);
          router.push(redirectUrl);
          return;
        }

        if (password && found.password && found.password !== password.trim()) {
          setWrongPasswordMember({ id: found.id, name: found.nickname || found.name });
          setError("รหัสผ่านไม่ตรงกับที่เคยบันทึกไว้ในระบบ");
          return;
        }
        login(found.id);
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
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

        {searchParams.get("redirect") && (
          <div
            style={{
              background: "#eff6ff",
              color: "#1e40af",
              border: "1px solid #bfdbfe",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>🔗</span>
            <span>คุณได้รับคำเชิญเข้าร่วมกลุ่ม กรุณาเข้าสู่ระบบก่อนเพื่อตอบรับคำเชิญ</span>
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
                ➔ ไปหน้าหลัก
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
                  {wrongPasswordMember && (
                    <div style={{ marginTop: "10px" }}>
                      <button
                        type="button"
                        className="primary"
                        style={{
                          padding: "8px 14px",
                          fontSize: "13px",
                          borderRadius: "8px",
                          width: "100%",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          updateProfile(wrongPasswordMember.id, { password: password.trim() });
                          login(wrongPasswordMember.id);
                          const redirectUrl = searchParams.get("redirect") || "/";
                          router.push(redirectUrl);
                        }}
                      >
                        🔑 อัปเดตเป็นรหัสผ่านใหม่นี้และเข้าสู่ระบบทันที
                      </button>
                    </div>
                  )}
                  {notFoundEmail && (
                    <div style={{ marginTop: "8px" }}>
                      <Link
                        href={
                          searchParams.get("redirect")
                            ? `/register?redirect=${encodeURIComponent(searchParams.get("redirect")!)}&email=${encodeURIComponent(notFoundEmail)}`
                            : `/register?email=${encodeURIComponent(notFoundEmail)}`
                        }
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
            href={
              searchParams.get("redirect")
                ? `/register?redirect=${encodeURIComponent(searchParams.get("redirect")!)}${email ? `&email=${encodeURIComponent(email)}` : ""}`
                : (email ? `/register?email=${encodeURIComponent(email)}` : "/register")
            }
            className="link"
            style={{ fontWeight: 700 }}
          >
            สมัครสมาชิกใหม่ด้วยอีเมลที่นี่ ➔
          </Link>
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
