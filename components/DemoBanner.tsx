"use client";

import React from "react";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";

export function DemoBanner() {
  const { isDemo, logout } = useGroup();

  if (!isDemo) return null;

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)",
        borderBottom: "1px solid #fde68a",
        color: "#92400e",
        padding: "10px 16px",
        fontSize: "13px",
      }}
    >
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
          <span
            style={{
              background: "#f59e0b",
              color: "#fff",
              fontWeight: 700,
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "99px",
              letterSpacing: "0.5px",
            }}
          >
            DEMO MODE
          </span>
          <span>
            ⚡ <strong>โหมดทดลองใช้งาน:</strong> เปิดให้ทดลองเฉพาะฟังก์ชัน{" "}
            <strong style={{ color: "#1f6f53", textDecoration: "underline" }}>
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
              color: "#92400e",
              borderColor: "#f59e0b",
              background: "#fff",
            }}
          >
            🚀 สมัครสมาชิก
          </Link>
          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "none",
              color: "#b45309",
              fontSize: "12px",
              cursor: "pointer",
              padding: "4px 8px",
              textDecoration: "underline",
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
