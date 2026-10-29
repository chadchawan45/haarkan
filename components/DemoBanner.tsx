"use client";

import React from "react";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";

export function DemoBanner() {
  const { isDemo, logout } = useGroup();

  if (!isDemo) return null;

  return (
    <div className="demo-banner">
      <div
        className="shell"
        style={{
          padding: 0,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="demo-badge">DEMO MODE</span>
          <span>
            ⚡ <strong>โหมดทดลองใช้งาน:</strong> เปิดให้ทดลองเฉพาะฟังก์ชัน{" "}
            <strong style={{ color: "var(--primary)", textDecoration: "underline" }}>
              &quot;เพิ่มรายจ่าย&quot;
            </strong>{" "}
            เท่านั้น (ฟังก์ชันอื่นถูกล็อกไว้)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/expenses/new"
            className="primary"
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            ＋ เพิ่มรายจ่าย
          </Link>
          <Link
            href="/register"
            className="secondary"
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            🚀 สมัครสมาชิก
          </Link>
          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              fontSize: "12px",
              cursor: "pointer",
              padding: "4px 8px",
              textDecoration: "underline",
              opacity: 0.8,
            }}
            title="ออกจากโหมดทดลองใช้งานและกลับสู่หน้าหลัก"
          >
            ออกจากเดโม
          </button>
        </div>
      </div>
    </div>
  );
}
