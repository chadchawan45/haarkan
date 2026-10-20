"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";
import { PasswordInput } from "@/components/PasswordInput";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function LoginPage() {
  const router = useRouter();
  const { members, login, isAuthenticated, currentMember } = useGroup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ตรวจสอบกับสมาชิกที่มีอยู่ในระบบตามชื่อจริง ชื่อเล่น หรืออีเมล
      const cleanInput = email.trim().toLowerCase();
      const found = members.find(
        (m) =>
          m.name.toLowerCase() === cleanInput ||
          m.nickname?.toLowerCase() === cleanInput ||
          m.email?.toLowerCase() === cleanInput ||
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
        setError("ไม่พบบัญชีผู้ใช้นี้ กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมล หรือสมัครสมาชิกใหม่");
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
          <p style={{ color: "#6a766e", fontSize: "14px", marginTop: "8px" }}>
            ระบบจัดการค่าใช้จ่ายกลุ่ม (Group Expense Manager)
          </p>
          <h2 style={{ fontSize: "20px", margin: "14px 0 0" }}>เข้าสู่ระบบ</h2>
        </div>

        {/* ปุ่มเข้าสู่ระบบผ่าน Google */}
        <div style={{ marginBottom: "20px" }}>
          <GoogleLoginButton text="เข้าสู่ระบบด้วย Google" />
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
            หรือเข้าสู่ระบบด้วยชื่อผู้ใช้
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border, #eef0ed)" }} />
        </div>

        {isAuthenticated && (
          <div className="notice" style={{ marginBottom: "18px" }}>
            คุณกำลังเข้าสู่ระบบอยู่ในชื่อ <strong>{currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name}</strong>
            <div style={{ marginTop: "8px" }}>
              <Link href="/" className="link" style={{ marginRight: "12px" }}>
                ➔ ไปหน้าภาพรวม
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleCustomLogin}>
          <label className="field">
            อีเมล, ชื่อเล่น หรือ ชื่อผู้ใช้
            <input
              type="text"
              placeholder="เช่น กานต์, มิน หรือ karn@haarkan.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>รหัสผ่าน</span>
              <Link href="/forgot-password" className="link" style={{ fontSize: "12px", fontWeight: 500 }}>
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <div
              style={{
                background: "#fdf2f2",
                color: "#c0392b",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="primary full-btn" disabled={loading} style={{ fontWeight: 700, padding: "12px" }}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px" }}>
          ลืมรหัสผ่าน?{" "}
          <Link href="/forgot-password" className="link" style={{ fontWeight: 600 }}>
            กู้คืนบัญชีผู้ใช้ที่นี่
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: "10px", fontSize: "13px" }}>
          ยังไม่มีบัญชีผู้ใช้?{" "}
          <Link href="/register" className="link" style={{ fontWeight: 600 }}>
            สมัครสมาชิกใหม่ที่นี่
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Link href="/" className="link">
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}
