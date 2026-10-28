"use client";

import React, { useEffect, useState } from "react";

interface AdminGroupItem {
  id: string;
  name: string;
  description?: string;
  code: string;
  creatorMemberId?: string;
  creatorName: string;
  defaultCurrency: string;
  createdAt: string;
  memberCount: number;
  expensesCount: number;
  paymentsCount: number;
  totalExpenseSatang: number;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<AdminGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    group: AdminGroupItem | null;
    reason: string;
  }>({ isOpen: false, group: null, reason: "" });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/groups?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "ไม่สามารถโหลดข้อมูลกลุ่มได้");
        setLoading(false);
        return;
      }
      setGroups(data.groups || []);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่ม");
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeleteGroup = async () => {
    if (!deleteModal.group) return;
    if (!deleteModal.reason.trim()) {
      alert("กรุณาระบุเหตุผลในการลบกลุ่ม");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: deleteModal.group.id,
          reason: deleteModal.reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "ไม่สามารถลบกลุ่มได้");
        setActionLoading(false);
        return;
      }

      setDeleteModal({ isOpen: false, group: null, reason: "" });
      fetchGroups();
    } catch (err: any) {
      alert(err?.message || "เกิดข้อผิดพลาดในการลบกลุ่ม");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            จัดการกลุ่มและข้อมูล (Data Management)
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
            ตรวจสอบความถูกต้องของกลุ่ม สมาชิก และยอดรายจ่ายทั้งหมดในระบบ
          </p>
        </div>
        <button
          onClick={fetchGroups}
          style={{
            padding: "8px 16px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
            color: "var(--text-primary, #ffffff)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          🔄 รีเฟรชรายการกลุ่ม
        </button>
      </div>

      {/* SEARCH BAR */}
      <div
        style={{
          padding: "16px",
          background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "14px",
        }}
      >
        <input
          type="text"
          placeholder="🔍 ค้นหากลุ่มด้วยชื่อกลุ่ม, รหัส 6 หลัก (Code), หรือชื่อผู้สร้าง..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
            borderRadius: "8px",
            color: "var(--text-primary, #ffffff)",
            fontSize: "13px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* GROUPS TABLE */}
      <div
        style={{
          background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))", color: "var(--text-muted, #94a3b8)" }}>
                <th style={{ padding: "14px 16px" }}>ชื่อกลุ่ม</th>
                <th style={{ padding: "14px 16px" }}>รหัสกลุ่ม (Code)</th>
                <th style={{ padding: "14px 16px" }}>ผู้สร้าง</th>
                <th style={{ padding: "14px 16px" }}>สมาชิก</th>
                <th style={{ padding: "14px 16px" }}>ยอดรวมรายจ่าย</th>
                <th style={{ padding: "14px 16px" }}>วันที่สร้าง</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
                    กำลังโหลดข้อมูลกลุ่ม...
                  </td>
                </tr>
              ) : groups.length > 0 ? (
                groups.map((g) => (
                  <tr
                    key={g.id}
                    style={{ borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.04))" }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{g.name}</div>
                      {g.description && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {g.description}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "rgba(255, 255, 255, 0.08)",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          color: "#38bdf8",
                        }}
                      >
                        {g.code}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-muted, #94a3b8)" }}>
                      {g.creatorName}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      {g.memberCount} คน
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#10b981" }}>
                        ฿{(g.totalExpenseSatang / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
                        {g.expensesCount} รายจ่าย / {g.paymentsCount} เคลียร์หนี้
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-muted, #94a3b8)", whiteSpace: "nowrap" }}>
                      {new Date(g.createdAt).toLocaleDateString("th-TH")}
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, group: g, reason: "" })}
                        style={{
                          padding: "5px 10px",
                          fontSize: "12px",
                          background: "rgba(239, 68, 68, 0.12)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "#fca5a5",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        ลบกลุ่ม
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
                    ไม่พบกลุ่มที่ตรงกับคำค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE GROUP MODAL */}
      {deleteModal.isOpen && deleteModal.group && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: "20px",
          }}
          onClick={() => setDeleteModal({ isOpen: false, group: null, reason: "" })}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "var(--bg-card, #0f172a)",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
              borderRadius: "16px",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 10px 0", color: "#f87171" }}>
              ⚠️ ยืนยันการลบกลุ่ม
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", margin: "0 0 16px 0" }}>
              คุณกำลังจะลบกลุ่ม <strong>&ldquo;{deleteModal.group.name}&rdquo;</strong> (รหัส {deleteModal.group.code}) การดำเนินการนี้จะลบรายการค่าใช้จ่ายและบันทึกการชำระเงินทั้งหมดของกลุ่มนี้ด้วย
            </p>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
                เหตุผลในการลบกลุ่ม (บังคับกรอกเพื่อบันทึกใน Audit Log):
              </label>
              <textarea
                value={deleteModal.reason}
                onChange={(e) => setDeleteModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="เช่น กลุ่มทดสอบของผู้ใช้, ละเมิดข้อกำหนดการใช้งาน, คำขอจากเจ้าของกลุ่ม"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
                  color: "#ffffff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setDeleteModal({ isOpen: false, group: null, reason: "" })}
                disabled={actionLoading}
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={actionLoading || !deleteModal.reason.trim()}
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: actionLoading || !deleteModal.reason.trim() ? "not-allowed" : "pointer",
                  opacity: actionLoading || !deleteModal.reason.trim() ? 0.6 : 1,
                }}
              >
                {actionLoading ? "กำลังลบ..." : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
