"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/lib/group-context";

export function DemoLockModal() {
  const router = useRouter();
  const { demoLockModal, closeDemoLock } = useGroup();

  if (!demoLockModal.isOpen) return null;

  const handleGoToAddExpense = () => {
    closeDemoLock();
    router.push("/expenses/new");
  };

  const handleGoToRegister = () => {
    closeDemoLock();
    router.push("/register");
  };

  return (
    <div className="modal-overlay" onClick={closeDemoLock} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "480px",
          textAlign: "center",
          padding: "30px 24px",
          border: "2px solid #f59e0b",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "#fef3c7",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            margin: "0 auto 16px",
            boxShadow: "0 4px 14px rgba(245, 158, 11, 0.25)",
          }}
        >
          🔒
        </div>

        <h3 style={{ fontSize: "20px", margin: "0 0 8px", color: "#92400e" }}>
          ฟังก์ชันนี้ถูกล็อกในโหมดทดลองใช้งาน
        </h3>

        {demoLockModal.featureName && (
          <div
            style={{
              display: "inline-block",
              background: "#fef3c7",
              color: "#92400e",
              fontWeight: 600,
              fontSize: "13px",
              padding: "4px 12px",
              borderRadius: "99px",
              marginBottom: "14px",
              border: "1px solid #fde68a",
            }}
          >
            🚫 {demoLockModal.featureName}
          </div>
        )}

        <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.6, margin: "0 0 20px" }}>
          ในโหมดทดลองใช้งาน (Demo Mode) ระบบเปิดให้คุณทดลองได้เฉพาะฟังก์ชัน{" "}
          <strong style={{ color: "#1f6f53" }}>&quot;＋ เพิ่มรายจ่าย&quot;</strong> เท่านั้น
          เพื่อทดสอบความแม่นยำในการคำนวณและกระจายเศษสตางค์ 100%
          <br />
          <br />
          ฟังก์ชันอื่นๆ เช่น การเคลียร์เงิน, แนบสลิป, ยืนยันยอด, แก้ไขข้อมูลกลุ่ม และการจัดการแอดมิน
          จะเปิดให้ใช้งานเต็มรูปแบบเมื่อคุณสมัครสมาชิกหรือเข้าสู่ระบบจริง
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            className="primary"
            onClick={handleGoToAddExpense}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            ＋ ไปหน้าเพิ่มรายจ่าย (เปิดให้ทดลองใช้งาน)
          </button>

          <button
            className="secondary"
            onClick={handleGoToRegister}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#1f6f53",
              borderColor: "#1f6f53",
            }}
          >
            🚀 สมัครสมาชิกเพื่อปลดล็อกทุกฟังก์ชัน
          </button>

          <button
            type="button"
            className="link"
            onClick={closeDemoLock}
            style={{
              marginTop: "4px",
              fontSize: "13px",
              color: "#888",
              cursor: "pointer",
            }}
          >
            ปิดหน้าต่างนี้
          </button>
        </div>
      </div>
    </div>
  );
}
