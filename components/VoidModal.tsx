"use client";

import React, { useState } from "react";
import { useGroup, ExpenseRecord } from "@/lib/group-context";
import { formatTHB } from "@/lib/money";

interface VoidModalProps {
  expense: ExpenseRecord | null;
  onClose: () => void;
}

export function VoidModal({ expense, onClose }: VoidModalProps) {
  const { voidExpense, isAdmin, isDemo, triggerDemoLock } = useGroup();
  const [reason, setReason] = useState("");

  if (!expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      triggerDemoLock("การยกเลิกบิลรายจ่าย");
      onClose();
      return;
    }
    if (!reason.trim()) return;
    voidExpense(expense.id, reason.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ color: "#d9483b" }}>ยกเลิกรายจ่าย (Void)</h3>
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
            🔒 <strong>โหมดทดลองใช้งาน (Demo Mode):</strong> การยกเลิกบิลถูกล็อกไว้ (เปิดให้ทดลองเฉพาะ &quot;＋ เพิ่มรายจ่าย&quot; เท่านั้น)
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "14px", margin: "0 0 4px" }}>
            คุณกำลังจะยกเลิกรายการ: <strong>{expense.title}</strong>
          </p>
          <p style={{ fontSize: "14px", margin: "0 0 12px", color: "#666" }}>
            ยอดรวม: <strong>{formatTHB(expense.totalAmountSatang)}</strong>
          </p>

          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fde68a",
              color: "#92400e",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "12px",
            }}
          >
            ⚠️ การยกเลิกจะคงประวัติไว้ในระบบ แต่จะไม่นำยอดนี้ไปคำนวณใน Net Balance อีกต่อไป
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            ระบุเหตุผลในการยกเลิก (จำเป็น):
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น ใส่จำนวนเงินผิด, ซ้ำซ้อน"
              required
              autoFocus
            />
          </label>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              type="submit"
              className="danger-btn"
              style={{
                flex: 1,
                padding: "10px",
                ...(isDemo ? { opacity: 0.85, cursor: "not-allowed" } : {}),
              }}
              disabled={!reason.trim()}
            >
              {isDemo ? "🔒 ยืนยันยกเลิกรายการ (ล็อกในเดโม)" : "ยืนยันการยกเลิกรายการ"}
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
