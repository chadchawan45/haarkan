"use client";

import React, { useEffect, useState, useMemo } from "react";

interface AdminUserItem {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  systemRole: string;
  status: string;
  avatarColor: string;
  avatarUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
  promptpayNumber?: string;
  groupsCount: number;
  expensesCount: number;
  totalSpentSatang: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Selected user for detail modal
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Status confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: AdminUserItem | null;
    nextStatus: string;
  }>({ isOpen: false, user: null, nextStatus: "" });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}&status=${statusFilter}&role=${roleFilter}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "ไม่สามารถโหลดรายชื่อสมาชิกได้");
        setLoading(false);
        return;
      }
      setUsers(data.users || []);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, roleFilter]);

  const handleStatusChange = async (user: AdminUserItem, nextStatus: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้");
        setActionLoading(false);
        return;
      }
      setConfirmModal({ isOpen: false, user: null, nextStatus: "" });
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (user: AdminUserItem, nextRole: string) => {
    if (!confirm(`คุณต้องการเปลี่ยนบทบาทของ "${user.name}" เป็น "${nextRole}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, systemRole: nextRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "ไม่สามารถเปลี่ยนบทบาทได้");
        setActionLoading(false);
        return;
      }
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท");
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
            จัดการสมาชิก (User Management)
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
            ค้นหา ตรวจสอบบทบาท ระงับหรือเปิดใช้งานบัญชีผู้ใช้ในระบบ
          </p>
        </div>
        <button
          onClick={fetchUsers}
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
          🔄 รีเฟรชรายชื่อ
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          padding: "16px",
          background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "14px",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            placeholder="🔍 ค้นหาด้วยชื่อ, อีเมล, เบอร์โทร..."
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

        <div style={{ minWidth: "150px" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
              borderRadius: "8px",
              color: "var(--text-primary, #ffffff)",
              fontSize: "13px",
            }}
          >
            <option value="all">ทุกสถานะบัญชี</option>
            <option value="active">เปิดใช้งาน (Active)</option>
            <option value="suspended">ระงับการใช้งาน (Suspended)</option>
          </select>
        </div>

        <div style={{ minWidth: "150px" }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
              borderRadius: "8px",
              color: "var(--text-primary, #ffffff)",
              fontSize: "13px",
            }}
          >
            <option value="all">ทุกบทบาท (Roles)</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="support">Support</option>
            <option value="analyst">Analyst</option>
            <option value="member">Member</option>
          </select>
        </div>
      </div>

      {/* USERS TABLE */}
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
                <th style={{ padding: "14px 16px" }}>สมาชิก</th>
                <th style={{ padding: "14px 16px" }}>ข้อมูลติดต่อ</th>
                <th style={{ padding: "14px 16px" }}>บทบาทในระบบ</th>
                <th style={{ padding: "14px 16px" }}>กลุ่ม / รายจ่าย</th>
                <th style={{ padding: "14px 16px" }}>สถานะ</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
                    กำลังค้นหาและโหลดรายชื่อ...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isSuper = u.id === "mem-golf" || u.email?.toLowerCase() === "golf2545mc@gmail.com";
                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.04))" }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: u.avatarColor || "#1f6f53",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            {u.nickname && (
                              <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
                                ({u.nickname})
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "var(--text-muted, #94a3b8)" }}>
                        <div>{u.email || "-"}</div>
                        <div style={{ fontSize: "11px" }}>{u.phone || ""}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {isSuper ? (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "3px 8px",
                              borderRadius: "99px",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#10b981",
                              fontWeight: 600,
                            }}
                          >
                            Super Admin (ผู้ดูแลหลัก)
                          </span>
                        ) : (
                          <select
                            value={u.systemRole}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              borderRadius: "6px",
                              background: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                              color: "var(--text-primary, #ffffff)",
                            }}
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="support">Support</option>
                            <option value="analyst">Analyst</option>
                            <option value="member">Member</option>
                          </select>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div>{u.groupsCount} กลุ่ม</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
                          ฿{(u.totalSpentSatang / 100).toLocaleString("th-TH")} ({u.expensesCount} รายการ)
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: "99px",
                            background:
                              u.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: u.status === "active" ? "#10b981" : "#ef4444",
                            fontWeight: 600,
                          }}
                        >
                          {u.status === "active" ? "เปิดใช้งาน" : "ระงับการใช้งาน"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            onClick={() => setSelectedUser(u)}
                            style={{
                              padding: "5px 10px",
                              fontSize: "12px",
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              color: "var(--text-primary, #ffffff)",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            รายละเอียด
                          </button>

                          {!isSuper && (
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  user: u,
                                  nextStatus: u.status === "active" ? "suspended" : "active",
                                })
                              }
                              style={{
                                padding: "5px 10px",
                                fontSize: "12px",
                                background:
                                  u.status === "active" ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                border:
                                  u.status === "active"
                                    ? "1px solid rgba(239, 68, 68, 0.25)"
                                    : "1px solid rgba(16, 185, 129, 0.25)",
                                color: u.status === "active" ? "#fca5a5" : "#86efac",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                            >
                              {u.status === "active" ? "ระงับบัญชี" : "ปลดระงับ"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
                    ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
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
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "var(--bg-card, #0f172a)",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                รายละเอียดสมาชิก
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted, #94a3b8)" }}>User ID:</span>
                <span style={{ fontFamily: "monospace" }}>{selectedUser.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted, #94a3b8)" }}>ชื่อ-นามสกุล:</span>
                <span style={{ fontWeight: 600 }}>{selectedUser.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted, #94a3b8)" }}>อีเมล:</span>
                <span>{selectedUser.email || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted, #94a3b8)" }}>เบอร์โทรศัพท์:</span>
                <span>{selectedUser.phone || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted, #94a3b8)" }}>พร้อมเพย์:</span>
                <span>{selectedUser.promptpayNumber || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted, #94a3b8)" }}>บัญชีธนาคาร:</span>
                <span>{selectedUser.bankName ? `${selectedUser.bankName} ${selectedUser.bankAccountNumber || ""}` : "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--text-muted, #94a3b8)" }}>บทบาทในระบบ:</span>
                <span style={{ fontWeight: 600, color: "#10b981" }}>{selectedUser.systemRole}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted, #94a3b8)" }}>สถานะบัญชี:</span>
                <span style={{ fontWeight: 600 }}>{selectedUser.status}</span>
              </div>
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS MODAL */}
      {confirmModal.isOpen && confirmModal.user && (
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
          onClick={() => setConfirmModal({ isOpen: false, user: null, nextStatus: "" })}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "var(--bg-card, #0f172a)",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
              borderRadius: "16px",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 10px 0" }}>
              ยืนยันการ{confirmModal.nextStatus === "suspended" ? "ระงับบัญชี" : "เปิดใช้งานบัญชี"}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", margin: "0 0 20px 0" }}>
              คุณแน่ใจหรือไม่ว่าต้องการ{confirmModal.nextStatus === "suspended" ? "ระงับบัญชีผู้ใช้ของ" : "ปลดระงับและเปิดใช้งานบัญชีของ"}{" "}
              <strong>&ldquo;{confirmModal.user.name}&rdquo;</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setConfirmModal({ isOpen: false, user: null, nextStatus: "" })}
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
                onClick={() => handleStatusChange(confirmModal.user!, confirmModal.nextStatus)}
                disabled={actionLoading}
                style={{
                  padding: "8px 16px",
                  background: confirmModal.nextStatus === "suspended" ? "#ef4444" : "#10b981",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {actionLoading ? "กำลังดำเนินการ..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
