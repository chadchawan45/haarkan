"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/lib/group-context";

export function JoinRoomModal() {
  const router = useRouter();
  const {
    joinModalOpen,
    setJoinModalOpen,
    joinGroupByCode,
    groups,
    isAuthenticated,
  } = useGroup();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!joinModalOpen) return null;

  const handleClose = () => {
    setJoinModalOpen(false);
    setCode("");
    setError("");
    setSuccess(null);
  };

  const handleJoin = async (targetCode?: string) => {
    const codeToUse = (targetCode || code).trim().toUpperCase();
    setError("");
    setSuccess(null);

    if (!codeToUse || codeToUse.length < 3) {
      setError("กรุณากรอกรหัสกลุ่มให้ถูกต้อง (6 ตัวอักษร)");
      return;
    }

    if (!isAuthenticated) {
      // หากยังไม่ได้ล็อกอิน ให้พาไปหน้ารับคำเชิญที่แสดงชื่อห้องและปุ่มสมัคร/ล็อกอิน
      handleClose();
      router.push(`/invites/${codeToUse}`);
      return;
    }

    setLoading(true);
    try {
      const result = await joinGroupByCode(codeToUse);

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          handleClose();
          router.push("/");
        }, 1000);
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการเข้าร่วมกลุ่ม");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#fff",
          borderRadius: "18px",
          padding: "28px 24px",
          boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
          position: "relative",
          animation: "modalSlideUp 0.25s ease-out",
        }}
      >
        <button
          onClick={handleClose}
          type="button"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "20px",
            color: "#888",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="ปิด"
        >
          ✕
        </button>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #1f6f53 0%, #154c39 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 14px",
              boxShadow: "0 8px 18px rgba(31, 111, 83, 0.3)",
            }}
          >
            👥
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "20px" }}>เข้าร่วมกลุ่ม (Join Group)</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted, #6a766e)", lineHeight: 1.5 }}>
            ขอรหัสกลุ่ม 6 ตัวจากเพื่อนหรือผู้สร้างกลุ่ม แล้วนำมากรอกที่นี่เพื่อเข้าร่วมกลุ่มทันที
          </p>
        </div>

        {success ? (
          <div
            style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              margin: "12px 0",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "6px" }}>🎉</div>
            <strong style={{ fontSize: "15px", display: "block" }}>{success}</strong>
            <p style={{ fontSize: "12px", margin: "4px 0 0", color: "#047857" }}>
              กำลังนำคุณเข้าสู่กลุ่ม...
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin();
            }}
          >
            <label className="field" style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                รหัสกลุ่ม 6 หลัก (Group Code) <span style={{ color: "#d9483b" }}>*</span>
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
                  setError("");
                }}
                placeholder="กรอกรหัส 6 หลัก"
                maxLength={8}
                autoFocus
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  letterSpacing: "4px",
                  textAlign: "center",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "2px solid #1f6f53",
                  background: "rgba(31, 111, 83, 0.04)",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                disabled={loading}
              />
            </label>

            {error && (
              <div
                style={{
                  background: "#fdf2f2",
                  color: "#c0392b",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="secondary"
                onClick={handleClose}
                disabled={loading}
                style={{ padding: "10px 18px", fontSize: "14px", borderRadius: "10px" }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="primary"
                disabled={loading || code.trim().length < 3}
                style={{
                  padding: "10px 22px",
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {loading ? "กำลังเข้าร่วม..." : "✓ เข้าร่วมกลุ่ม"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export const JoinGroupModal = JoinRoomModal;
