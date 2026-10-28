"use client";

import React, { useState } from "react";
import { useGroup, PaymentRecord } from "@/lib/group-context";
import { formatTHB } from "@/lib/money";

interface ProofModalProps {
  payment: PaymentRecord | null;
  onClose: () => void;
}

export function ProofModal({ payment, onClose }: ProofModalProps) {
  const { members, currentMemberId, isAdmin, isDemo, triggerDemoLock, confirmPayment, rejectPayment } = useGroup();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (!payment) return null;

  const fromMember = members.find((m) => m.id === payment.fromMemberId);
  const toMember = members.find((m) => m.id === payment.toMemberId);

  // ผู้รับเงิน หรือ Admin ของกลุ่มเท่านั้นที่มีสิทธิ์ตัดสินใจ
  const canDecide = currentMemberId === payment.toMemberId || isAdmin;

  const handleConfirm = () => {
    if (isDemo) {
      triggerDemoLock("การยืนยันยอดเงินและลดหนี้");
      onClose();
      return;
    }
    confirmPayment(payment.id);
    onClose();
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      triggerDemoLock("การปฏิเสธสลิป");
      onClose();
      return;
    }
    if (!reason.trim()) return;
    rejectPayment(payment.id, reason.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>ตรวจสอบสลิปการโอนเงิน</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {isDemo && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fde68a",
              color: "#92400e",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "14px",
            }}
          >
            🔒 <strong>โหมดทดลองใช้งาน (Demo Mode):</strong> การตรวจและยืนยันสลิปถูกล็อกไว้ (เปิดให้ทดลองเฉพาะ &quot;＋ เพิ่มรายจ่าย&quot; เท่านั้น)
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>ผู้โอนเงิน:</span>
            <strong style={{ color: "var(--text-main)" }}>{fromMember?.name}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>ผู้รับเงิน:</span>
            <strong style={{ color: "var(--text-main)" }}>{toMember?.name}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>จำนวนเงิน:</span>
            <strong style={{ fontSize: "16px", color: "var(--primary)" }}>
              {formatTHB(payment.amountSatang)}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>สถานะ:</span>
            <span className={`badge badge-${payment.status}`}>{payment.status}</span>
          </div>
        </div>

        {payment.proof ? (
          <div
            style={{
              background: "rgba(148, 163, 184, 0.05)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "12px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px" }}>
              📄 {payment.proof.filename}
            </p>
            <img
              src={payment.proof.url}
              alt="หลักฐานการโอนเงิน"
              style={{
                maxWidth: "100%",
                maxHeight: "260px",
                borderRadius: "8px",
                objectFit: "contain",
              }}
            />
          </div>
        ) : (
          <div className="notice" style={{ marginBottom: "16px" }}>
            ⚠️ รายการนี้ยังไม่มีการแนบไฟล์สลิป
          </div>
        )}

        {payment.rejectionReason && (
          <div
            style={{
              background: "#fdf2f2",
              border: "1px solid #f9d2d2",
              color: "#c0392b",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            <strong>เหตุผลที่ถูกปฏิเสธ:</strong> {payment.rejectionReason}
          </div>
        )}

        {payment.status === "submitted" && canDecide && !rejecting && (
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              className={isDemo ? "secondary" : "primary"}
              style={{
                flex: 1,
                ...(isDemo ? { borderColor: "#f59e0b", color: "#92400e", background: "#fef3c7" } : {}),
              }}
              onClick={handleConfirm}
            >
              {isDemo ? "🔒 ยืนยันยอดเงิน (ล็อกในเดโม)" : "✓ ยืนยันยอดเงิน (ลดหนี้)"}
            </button>
            <button
              className="danger-btn"
              onClick={isDemo ? () => { triggerDemoLock("การปฏิเสธสลิป"); onClose(); } : () => setRejecting(true)}
            >
              {isDemo ? "🔒 ปฏิเสธสลิป" : "✕ ปฏิเสธสลิป"}
            </button>
          </div>
        )}

        {rejecting && (
          <form onSubmit={handleReject} style={{ marginTop: "14px" }}>
            <label className="field">
              ระบุเหตุผลในการปฏิเสธ:
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="เช่น ยอดเงินไม่ตรง, สลิปซ้ำ"
                required
                autoFocus
              />
            </label>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button type="submit" className="danger-btn" style={{ flex: 1 }}>
                ยืนยันการปฏิเสธ
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setRejecting(false)}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}

        {!canDecide && payment.status === "submitted" && (
          <p className="sub" style={{ textAlign: "center", margin: "14px 0 0" }}>
            เฉพาะผู้รับเงิน ({toMember?.name}) หรือ Admin เท่านั้นที่สามารถกดยืนยันหรือปฏิเสธได้
          </p>
        )}
      </div>
    </div>
  );
}
