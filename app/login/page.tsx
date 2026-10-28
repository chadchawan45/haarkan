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

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notFoundAccount, setNotFoundAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredNotice, setRegisteredNotice] = useState(false);
  const [wrongPasswordMember, setWrongPasswordMember] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const qAccount = searchParams.get("account") || searchParams.get("email");
    if (qAccount) {
      setAccount(qAccount);
    }
    if (searchParams.get("registered") === "true") {
      setRegisteredNotice(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotFoundAccount("");
    setWrongPasswordMember(null);
    setLoading(true);

    try {
      const cleanInput = account.trim();
      if (!cleanInput) {
        setError("กรุณากรอกเบอร์โทรศัพท์หรืออีเมลของคุณ");
        return;
      }

      const isEmail = cleanInput.includes("@");
      const cleanDigits = cleanInput.replace(/[^0-9]/g, "");
      const isPhone = !isEmail && cleanDigits.length >= 9 && cleanDigits.length <= 10;
      const lower = cleanInput.toLowerCase();

      // ค้นหาตามเบอร์โทรศัพท์, อีเมลจริง, ชื่อผู้ใช้/ชื่อเล่น, หรือ ID
      let found = members.find((m) => {
        // ค้นหาด้วยอีเมล
        if (m.email && m.email.toLowerCase() === lower) return true;
        // ค้นหาด้วยเบอร์โทรศัพท์ หรือเลขพร้อมเพย์
        if (cleanDigits.length >= 9) {
          if (m.phone && m.phone.replace(/[^0-9]/g, "") === cleanDigits) return true;
          if (m.promptpayNumber && m.promptpayNumber.replace(/[^0-9]/g, "") === cleanDigits) return true;
        }
        // ค้นหาด้วยชื่อ หรือชื่อเล่น
        if (m.name.toLowerCase() === lower) return true;
        if (m.nickname && m.nickname.toLowerCase() === lower) return true;
        if (m.id.toLowerCase() === lower) return true;
        return false;
      });

      const redirectUrl = searchParams.get("redirect") || "/";

      // หากยังไม่พบบัญชีในระบบ ให้แจ้งผู้ใช้สมัครสมาชิกโดยตรง ไม่สร้างบัญชีพร้อม default password123
      if (!found) {
        setNotFoundAccount(cleanInput);
        setError("ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมล/เบอร์โทรศัพท์ หรือสมัครสมาชิกใหม่");
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
          <h2 style={{ fontSize: "20px", margin: "14px 0 0" }}>เข้าสู่ระบบ</h2>
          <p style={{ color: "var(--text-muted, #6a766e)", fontSize: "13px", margin: "6px 0 0" }}>
            กรอกเบอร์โทรศัพท์ หรือ อีเมล และรหัสผ่านเพื่อเข้าใช้งาน
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
            <span>สมัครสมาชิกสำเร็จแล้ว! กรุณาเข้าสู่ระบบด้วยเบอร์โทรหรืออีเมลของคุณ</span>
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

        <form onSubmit={handleLogin}>
          <label className="field">
            <span>เบอร์โทรศัพท์ หรือ อีเมล <span style={{ color: "#d9483b" }}>*</span></span>
            <input
              type="text"
              placeholder="เช่น 081-234-5678 หรือ yourname@gmail.com"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                if (notFoundAccount) setNotFoundAccount("");
              }}
              required
              autoFocus
              autoComplete="username"
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
                  {notFoundAccount && (
                    <div style={{ marginTop: "8px" }}>
                      <Link
                        href={
                          searchParams.get("redirect")
                            ? `/register?redirect=${encodeURIComponent(searchParams.get("redirect")!)}&account=${encodeURIComponent(notFoundAccount)}`
                            : `/register?account=${encodeURIComponent(notFoundAccount)}`
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
                        ➔ สมัครสมาชิกด้วยบัญชีนี้ทันที
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
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "13px" }}>
          ยังไม่มีบัญชีผู้ใช้?{" "}
          <Link
            href={
              searchParams.get("redirect")
                ? `/register?redirect=${encodeURIComponent(searchParams.get("redirect")!)}${account ? `&account=${encodeURIComponent(account)}` : ""}`
                : (account ? `/register?account=${encodeURIComponent(account)}` : "/register")
            }
            className="link"
            style={{ fontWeight: 700 }}
          >
            สมัครสมาชิกใหม่ที่นี่ ➔
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
