"use client";

import React, { useEffect, useState } from "react";

interface AuditLogItem {
  id: string;
  actorId?: string;
  actorName: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  status: "success" | "failure" | "denied";
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `/api/admin/audit-logs?q=${encodeURIComponent(search)}&action=${actionFilter}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "ไม่สามารถโหลด Audit Logs ได้");
        setLoading(false);
        return;
      }
      setLogs(data.logs || []);
      setLoading(false);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        setError("การโหลด Audit Logs หมดเวลา (Timeout 8s) กรุณาลองใหม่อีกครั้ง");
      } else {
        setError(err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, actionFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            ประวัติการดำเนินการ (Audit Logs)
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
            บันทึกประวัติการกระทำของผู้ดูแลและเหตุการณ์สำคัญในระบบเพื่อความโปร่งใสและความปลอดภัย
          </p>
        </div>
        <button
          onClick={fetchLogs}
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
          🔄 รีเฟรช Logs
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
            placeholder="🔍 ค้นหาด้วยชื่อผู้ดำเนินการ, Action, หรือ Target ID..."
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

        <div style={{ minWidth: "160px" }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
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
            <option value="all">ทุกประเภทกิจกรรม</option>
            <option value="admin.">การเข้าสู่ระบบผู้ดูแล (admin.*)</option>
            <option value="user.">การจัดการผู้ใช้ (user.*)</option>
            <option value="group.">การจัดการกลุ่ม (group.*)</option>
            <option value="settings.">การตั้งค่าระบบ (settings.*)</option>
          </select>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "12px",
            color: "#fca5a5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <span style={{ fontWeight: 600 }}>⚠️ เกิดข้อผิดพลาด: </span>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLogs}
            style={{
              padding: "6px 14px",
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🔄 ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {/* AUDIT LOGS TABLE */}
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
                <th style={{ padding: "14px 16px" }}>วันเวลา</th>
                <th style={{ padding: "14px 16px" }}>ผู้ดำเนินการ (Actor)</th>
                <th style={{ padding: "14px 16px" }}>กิจกรรม (Action)</th>
                <th style={{ padding: "14px 16px" }}>เป้าหมาย (Target)</th>
                <th style={{ padding: "14px 16px" }}>ผลการทำงาน</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
                    กำลังโหลดประวัติ Audit Logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.04))" }}
                  >
                    <td style={{ padding: "14px 16px", color: "var(--text-muted, #94a3b8)", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{log.actorName || "System"}</div>
                      {log.actorEmail && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>{log.actorEmail}</div>
                      )}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "rgba(255, 255, 255, 0.06)",
                          fontFamily: "monospace",
                          fontSize: "12px",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-muted, #94a3b8)" }}>
                      {log.targetType} {log.targetId ? `(${log.targetId})` : ""}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "99px",
                          background:
                            log.status === "success"
                              ? "rgba(16, 185, 129, 0.15)"
                              : log.status === "denied"
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(245, 158, 11, 0.15)",
                          color:
                            log.status === "success"
                              ? "#10b981"
                              : log.status === "denied"
                              ? "#ef4444"
                              : "#f59e0b",
                          fontWeight: 600,
                        }}
                      >
                        {log.status === "success" ? "สำเร็จ" : log.status === "denied" ? "ถูกปฏิเสธ" : "ล้มเหลว"}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedLog(log)}
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
                        ดูข้อมูล
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
                    ไม่พบบันทึกกิจกรรม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL JSON MODAL */}
      {selectedLog && (
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
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-card, #0f172a)",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
              borderRadius: "18px",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                รายละเอียดบันทึกกิจกรรม ({selectedLog.action})
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", marginBottom: "16px" }}>
              <div><strong>Log ID:</strong> <span style={{ fontFamily: "monospace" }}>{selectedLog.id}</span></div>
              <div><strong>ผู้ดำเนินการ:</strong> {selectedLog.actorName} ({selectedLog.actorEmail || selectedLog.actorId || "-"})</div>
              <div><strong>เวลาที่บันทึก:</strong> {new Date(selectedLog.createdAt).toLocaleString("th-TH")}</div>
              <div><strong>เป้าหมาย:</strong> {selectedLog.targetType} {selectedLog.targetId ? `(ID: ${selectedLog.targetId})` : ""}</div>
              <div><strong>สถานะ:</strong> {selectedLog.status}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>ข้อมูลเพิ่มเติม (Details JSON):</div>
              <pre
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  overflowX: "auto",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#38bdf8",
                }}
              >
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => setSelectedLog(null)}
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
    </div>
  );
}
