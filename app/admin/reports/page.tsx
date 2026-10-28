"use client";

import React, { useState } from "react";

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: "users" | "groups" | "expenses") => {
    try {
      setDownloading(type);
      const res = await fetch(`/api/admin/reports/export?type=${type}`);
      if (!res.ok) {
        alert("ไม่สามารถดาวน์โหลดรายงานได้");
        setDownloading(null);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `haarkan_${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || "เกิดข้อผิดพลาดในการดาวน์โหลดรายงาน");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          รายงานและการส่งออกข้อมูล (Reports & Export)
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
          ส่งออกข้อมูลของระบบเป็นไฟล์ CSV ที่รองรับภาษาไทยสำหรับเปิดใน Microsoft Excel หรือ Google Sheets
        </p>
      </div>

      {/* EXPORT CARDS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Export 1: Users */}
        <div
          style={{
            padding: "24px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>👥</div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0" }}>
              รายงานรายชื่อสมาชิก (Users CSV)
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              ประกอบด้วย ID, ชื่อ-นามสกุล, ชื่อเล่น, อีเมล, เบอร์โทรศัพท์, บทบาทในระบบ, สถานะบัญชี, และยอดใช้จ่ายรวม
            </p>
          </div>
          <button
            onClick={() => handleDownload("users")}
            disabled={downloading === "users"}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: downloading === "users" ? "not-allowed" : "pointer",
              opacity: downloading === "users" ? 0.7 : 1,
            }}
          >
            {downloading === "users" ? "กำลังสร้างไฟล์ CSV..." : "📥 ส่งออกข้อมูลสมาชิก (CSV)"}
          </button>
        </div>

        {/* Export 2: Groups */}
        <div
          style={{
            padding: "24px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏢</div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0" }}>
              รายงานข้อมูลกลุ่ม (Groups CSV)
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              ประกอบด้วย Group ID, ชื่อกลุ่ม, รหัส 6 หลัก (Code), คำอธิบาย, ผู้สร้าง, จำนวนสมาชิก และวันที่สร้างกลุ่ม
            </p>
          </div>
          <button
            onClick={() => handleDownload("groups")}
            disabled={downloading === "groups"}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: downloading === "groups" ? "not-allowed" : "pointer",
              opacity: downloading === "groups" ? 0.7 : 1,
            }}
          >
            {downloading === "groups" ? "กำลังสร้างไฟล์ CSV..." : "📥 ส่งออกข้อมูลกลุ่ม (CSV)"}
          </button>
        </div>

        {/* Export 3: Expenses */}
        <div
          style={{
            padding: "24px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>💸</div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0" }}>
              รายงานรายการค่าใช้จ่าย (Expenses CSV)
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              ประกอบด้วย Expense ID, ชื่อรายการ, วันที่เกิดรายจ่าย, ยอดเงินรวม (บาท), หมวดหมู่, และสถานะรายการ
            </p>
          </div>
          <button
            onClick={() => handleDownload("expenses")}
            disabled={downloading === "expenses"}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: downloading === "expenses" ? "not-allowed" : "pointer",
              opacity: downloading === "expenses" ? 0.7 : 1,
            }}
          >
            {downloading === "expenses" ? "กำลังสร้างไฟล์ CSV..." : "📥 ส่งออกข้อมูลรายจ่าย (CSV)"}
          </button>
        </div>
      </div>
    </div>
  );
}
