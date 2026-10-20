"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";

export default function AcceptInvitePage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const { group, members, currentMember, isAuthenticated, logout } = useGroup();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ตรวจสอบว่าผู้ใช้กำลังล็อกอินและเป็นสมาชิกของกลุ่มนี้อยู่แล้วหรือไม่
  const isAlreadyMember = isAuthenticated && members.some(
    (m) => m.id === currentMember?.id && m.status === "active"
  );

  const handleJoinGroup = () => {
    setLoading(true);
    setSuccess(true);
    setTimeout(() => {
      router.push("/");
    }, 1200);
  };

  return (
    <main className="shell">
      <div style={{ maxWidth: "480px", margin: "40px auto" }} className="card">
        {/* ส่วนหัวแสดงข้อมูลกลุ่ม */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Link href="/" className="brand" style={{ justifyContent: "center", fontSize: "32px" }}>
            หาร<i>กัน</i>
          </Link>
          <div
            style={{
              display: "inline-block",
              background: "rgba(31, 111, 83, 0.1)",
              color: "#1f6f53",
              padding: "4px 14px",
              borderRadius: "99px",
              fontSize: "12px",
              fontWeight: 600,
              marginTop: "12px",
            }}
          >
            ✉️ คำเชิญเข้าร่วมกลุ่ม
          </div>
          <h2 style={{ margin: "12px 0 6px", fontSize: "22px" }}>{group.name}</h2>
          {group.description && (
            <p style={{ color: "var(--text-muted, #666)", fontSize: "14px", margin: "0 0 8px" }}>
              {group.description}
            </p>
          )}
        </div>

        {/* กรณีที่ 1: ยังไม่ได้เข้าสู่ระบบ (ต้องสมัครสมาชิกหรือเข้าสู่ระบบก่อนเท่านั้น) */}
        {!isAuthenticated && (
          <div>
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "24px", lineHeight: 1 }}>🔒</span>
              <div style={{ fontSize: "13px", color: "#92400e", lineHeight: 1.5 }}>
                <strong style={{ fontSize: "14px", display: "block", marginBottom: "3px" }}>
                  ต้องมีบัญชีผู้ใช้ก่อนเข้าร่วมกลุ่ม
                </strong>
                คุณต้องสมัครสมาชิกใหม่หรือเข้าสู่ระบบด้วยอีเมลของคุณก่อน จึงจะสามารถตอบรับคำเชิญและเริ่มแชร์ค่าใช้จ่ายในกลุ่มนี้ได้
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href={`/register?redirect=${encodeURIComponent(`/invites/${token}`)}`}
                className="primary full-btn"
                style={{
                  textAlign: "center",
                  padding: "12px",
                  fontSize: "15px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                📝 สมัครสมาชิกใหม่เพื่อเข้ากลุ่ม
              </Link>

              <Link
                href={`/login?redirect=${encodeURIComponent(`/invites/${token}`)}`}
                className="secondary full-btn"
                style={{
                  textAlign: "center",
                  padding: "11px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                🔑 มีบัญชีอยู่แล้ว? เข้าสู่ระบบด้วยอีเมล
              </Link>
            </div>
          </div>
        )}

        {/* กรณีที่ 2: เข้าสู่ระบบแล้ว และยอมรับคำเชิญสำเร็จ */}
        {isAuthenticated && success && (
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ color: "#1f6f53", margin: "0 0 8px", fontSize: "18px" }}>
              ยินดีต้อนรับเข้าสู่กลุ่ม {group.name}!
            </h3>
            <p style={{ color: "var(--text-muted, #666)", fontSize: "14px", margin: 0 }}>
              กำลังนำคุณเข้าสู่หน้าภาพรวมของกลุ่ม...
            </p>
          </div>
        )}

        {/* กรณีที่ 3: เข้าสู่ระบบแล้ว */}
        {isAuthenticated && !success && (
          <div>
            {isAlreadyMember ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>✓</span>
                  <strong style={{ color: "#065f46", fontSize: "15px", display: "block" }}>
                    คุณเป็นสมาชิกของกลุ่ม &quot;{group.name}&quot; อยู่แล้ว
                  </strong>
                  <p style={{ fontSize: "13px", color: "#047857", margin: "6px 0 0" }}>
                    บัญชีของคุณ: {currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name}
                  </p>
                </div>

                <Link
                  href="/"
                  className="primary full-btn"
                  style={{
                    display: "block",
                    padding: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  ➔ ไปยังหน้าภาพรวมกลุ่ม (Dashboard)
                </Link>
              </div>
            ) : (
              <div>
                {/* ข้อมูลบัญชีที่กำลังเข้าสู่ระบบ */}
                <div
                  style={{
                    background: "rgba(31, 111, 83, 0.06)",
                    border: "1px solid rgba(31, 111, 83, 0.2)",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: currentMember.avatarColor,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(currentMember.nickname || currentMember.name).slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted, #666)" }}>
                      เข้าร่วมด้วยบัญชี:
                    </div>
                    <strong style={{ fontSize: "15px", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name}
                    </strong>
                    {currentMember.email && (
                      <span style={{ fontSize: "12px", color: "var(--text-muted, #777)", display: "block" }}>
                        {currentMember.email}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="primary full-btn"
                  onClick={handleJoinGroup}
                  disabled={loading}
                  style={{ padding: "12px", fontWeight: 700, fontSize: "15px" }}
                >
                  {loading ? "กำลังเข้าร่วมกลุ่ม..." : "✓ ยอมรับคำเชิญและเข้าร่วมกลุ่ม"}
                </button>

                <div style={{ textAlign: "center", marginTop: "14px", fontSize: "12px" }}>
                  <span style={{ color: "var(--text-muted, #777)" }}>ไม่ใช่บัญชีของคุณ? </span>
                  <button
                    type="button"
                    className="link"
                    onClick={() => logout()}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    สลับบัญชีผู้ใช้
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", borderTop: "1px solid var(--border, #eef0ed)", paddingTop: "14px" }}>
          <Link href="/" className="link" style={{ fontSize: "13px" }}>
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}
