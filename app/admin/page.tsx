"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface StatsData {
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  totalGroups: number;
  totalExpenses: number;
  totalExpenseAmountSatang: number;
  totalPayments: number;
  totalConfirmedPaymentAmountSatang: number;
  recentExpenses: any[];
  recentAuditLogs: any[];
  recentMembers: any[];
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "ไม่สามารถโหลดข้อมูลสถิติได้");
        setLoading(false);
        return;
      }
      setStats(data.stats);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted, #94a3b8)" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(16, 185, 129, 0.2)",
            borderTopColor: "#10b981",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        กำลังโหลดข้อมูลภาพรวมระบบ...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        style={{
          padding: "24px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          borderRadius: "14px",
          color: "#fca5a5",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>⚠️ {error || "ไม่พบข้อมูลสถิติ"}</p>
        <button
          onClick={fetchStats}
          style={{
            marginTop: "12px",
            padding: "8px 16px",
            background: "#ef4444",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  const expenseTotalBaht = (stats.totalExpenseAmountSatang / 100).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const paymentTotalBaht = (stats.totalConfirmedPaymentAmountSatang / 100).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Prepare chart data from recent expenses
  const chartData = stats.recentExpenses.map((exp, index) => ({
    name: exp.title ? (exp.title.length > 10 ? exp.title.slice(0, 10) + "..." : exp.title) : `รายการ ${index + 1}`,
    amount: (exp.totalAmountSatang || 0) / 100,
  })).reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Page Title & Quick Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            ภาพรวมระบบ (Dashboard Overview)
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
            ข้อมูลสถิติการใช้งานและกิจกรรมจริงจากฐานข้อมูลระบบ
          </p>
        </div>
        <button
          onClick={fetchStats}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
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
          <span>🔄</span>
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* KPI METRICS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
        }}
      >
        {/* Card 1: Members */}
        <div
          style={{
            padding: "20px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", fontWeight: 500 }}>
              สมาชิกทั้งหมด
            </span>
            <span style={{ fontSize: "20px" }}>👥</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "10px", letterSpacing: "-0.02em" }}>
            {stats.totalMembers.toLocaleString("th-TH")}
          </div>
          <div style={{ fontSize: "12px", color: "#10b981", marginTop: "6px" }}>
            เปิดใช้งาน: {stats.activeMembers} | ถูกระงับ: {stats.suspendedMembers}
          </div>
        </div>

        {/* Card 2: Groups */}
        <div
          style={{
            padding: "20px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", fontWeight: 500 }}>
              กลุ่มทั้งหมด
            </span>
            <span style={{ fontSize: "20px" }}>🏢</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "10px", letterSpacing: "-0.02em" }}>
            {stats.totalGroups.toLocaleString("th-TH")}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)", marginTop: "6px" }}>
            กลุ่มที่มีการเคลื่อนไหวในระบบ
          </div>
        </div>

        {/* Card 3: Total Expenses Volume */}
        <div
          style={{
            padding: "20px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", fontWeight: 500 }}>
              ยอดรายจ่ายรวม (บาท)
            </span>
            <span style={{ fontSize: "20px" }}>💸</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "10px", letterSpacing: "-0.02em", color: "#38bdf8" }}>
            ฿{expenseTotalBaht}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)", marginTop: "6px" }}>
            จาก {stats.totalExpenses} รายการค่าใช้จ่าย
          </div>
        </div>

        {/* Card 4: Confirmed Settlements */}
        <div
          style={{
            padding: "20px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", fontWeight: 500 }}>
              ยอดเคลียร์หนี้ที่ยืนยันแล้ว
            </span>
            <span style={{ fontSize: "20px" }}>✅</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "10px", letterSpacing: "-0.02em", color: "#10b981" }}>
            ฿{paymentTotalBaht}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)", marginTop: "6px" }}>
            จาก {stats.totalPayments} ธุรกรรมการชำระเงิน
          </div>
        </div>
      </div>

      {/* CHART & RECENT EXPENSES SECTION */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Chart Card */}
        <div
          style={{
            padding: "24px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "18px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0" }}>
            📊 ยอดรายจ่ายล่าสุด (บาท)
          </h2>
          {chartData.length > 0 ? (
            <div style={{ height: "260px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                    formatter={(value: any) => [`฿${Number(value).toFixed(2)}`, "ยอดเงิน"]}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              style={{
                height: "220px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted, #94a3b8)",
                fontSize: "14px",
              }}
            >
              ยังไม่มีข้อมูลรายจ่ายในระบบ
            </div>
          )}
        </div>

        {/* Recent Members Card */}
        <div
          style={{
            padding: "24px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "18px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              👥 สมาชิกที่ลงทะเบียนล่าสุด
            </h2>
            <Link
              href="/admin/users"
              style={{ fontSize: "13px", color: "#10b981", textDecoration: "none", fontWeight: 500 }}
            >
              จัดการสมาชิกทั้งหมด →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {stats.recentMembers.length > 0 ? (
              stats.recentMembers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#1f6f53",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#ffffff",
                      }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>{m.email}</div>
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "99px",
                        background: m.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: m.status === "active" ? "#10b981" : "#ef4444",
                        fontWeight: 600,
                      }}
                    >
                      {m.status === "active" ? "ใช้งาน" : "ระงับ"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted, #94a3b8)", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                ยังไม่มีข้อมูลสมาชิก
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT SYSTEM AUDIT ACTIVITIES TABLE */}
      <div
        style={{
          padding: "24px",
          background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              📜 ประวัติกิจกรรมของระบบ (System Audit Trail)
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
              บันทึกการกระทำของผู้ดูแลและเหตุการณ์ความปลอดภัยของระบบ
            </p>
          </div>
          <Link
            href="/admin/audit-logs"
            style={{ fontSize: "13px", color: "#10b981", textDecoration: "none", fontWeight: 500 }}
          >
            ดูประวัติทั้งหมด →
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))", color: "var(--text-muted, #94a3b8)" }}>
                <th style={{ padding: "10px 12px" }}>เวลา</th>
                <th style={{ padding: "10px 12px" }}>ผู้ดำเนินการ</th>
                <th style={{ padding: "10px 12px" }}>กิจกรรม (Action)</th>
                <th style={{ padding: "10px 12px" }}>เป้าหมาย</th>
                <th style={{ padding: "10px 12px" }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAuditLogs.length > 0 ? (
                stats.recentAuditLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.04))" }}
                  >
                    <td style={{ padding: "12px", color: "var(--text-muted, #94a3b8)", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 500 }}>
                      {log.actorName || log.actorEmail || "System"}
                    </td>
                    <td style={{ padding: "12px", fontFamily: "monospace" }}>
                      {log.action}
                    </td>
                    <td style={{ padding: "12px", color: "var(--text-muted, #94a3b8)" }}>
                      {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)}...)` : ""}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
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
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
                    ยังไม่มีบันทึก Audit Logs ในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
