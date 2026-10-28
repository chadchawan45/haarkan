"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGroup } from "@/lib/group-context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, isDemo, currentMember, triggerDemoLock, demoLogin } = useGroup();

  if (!isAuthenticated) {
    return (
      <nav className="mobile-bottom-nav" aria-label="แถบเมนูด้านล่างบนมือถือ">
        <Link
          href="/"
          className={`mobile-nav-item ${pathname === "/" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">🏠</span>
          <span className="mobile-nav-label">หน้าแรก</span>
        </Link>

        <button
          onClick={demoLogin}
          className="mobile-nav-item"
          style={{ background: "transparent", border: "none" }}
        >
          <span className="mobile-nav-icon">⚡</span>
          <span className="mobile-nav-label">ทดลองเดโม</span>
        </button>

        <Link
          href="/login"
          className={`mobile-nav-item ${pathname === "/login" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">🔑</span>
          <span className="mobile-nav-label">เข้าสู่ระบบ</span>
        </Link>

        <Link
          href="/register"
          className={`mobile-nav-item ${pathname === "/register" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">📝</span>
          <span className="mobile-nav-label">สมัครสมาชิก</span>
        </Link>
      </nav>
    );
  }

  const handleBalancesClick = (e: React.MouseEvent) => {
    if (isDemo) {
      // Still navigate or let them view with locked actions
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="แถบเมนูหลักบนมือถือ">
      {/* 1. หน้าหลัก */}
      <Link
        href="/"
        className={`mobile-nav-item ${pathname === "/" ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">🏠</span>
        <span className="mobile-nav-label">หน้าหลัก</span>
      </Link>

      {/* 2. รายการรายจ่าย */}
      <Link
        href="/expenses"
        className={`mobile-nav-item ${pathname.startsWith("/expenses") && pathname !== "/expenses/new" ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">🧾</span>
        <span className="mobile-nav-label">รายจ่าย</span>
      </Link>

      {/* 3. ปุ่มตรงกลาง: เพิ่มรายจ่าย (ปุ่มเด่นที่สุด ใช้งานง่ายด้วยนิ้วโป้ง) */}
      <Link
        href="/expenses/new"
        className={`mobile-nav-center-btn ${pathname === "/expenses/new" ? "active" : ""}`}
        title="เพิ่มรายจ่ายใหม่"
        aria-label="เพิ่มรายจ่ายใหม่"
      >
        <span className="center-plus-icon">＋</span>
      </Link>

      {/* 4. เคลียร์เงิน & ชำระหนี้ */}
      <Link
        href="/balances"
        onClick={handleBalancesClick}
        className={`mobile-nav-item ${pathname.startsWith("/balances") ? "active" : ""}`}
      >
        <span className="mobile-nav-icon">{isDemo ? "🔒" : "💳"}</span>
        <span className="mobile-nav-label">{isDemo ? "เคลียร์หนี้" : "เคลียร์เงิน"}</span>
      </Link>

      {/* 5. โปรไฟล์ส่วนตัว */}
      <Link
        href="/profile"
        className={`mobile-nav-item ${pathname.startsWith("/profile") ? "active" : ""}`}
      >
        <div
          className="mobile-avatar-icon"
          style={{
            background: currentMember?.avatarColor || "#1f6f53",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {currentMember?.avatarUrl ? (
            <img
              src={currentMember.avatarUrl}
              alt="Avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            (currentMember?.nickname || currentMember?.name || "U").slice(0, 1)
          )}
        </div>
        <span className="mobile-nav-label">โปรไฟล์</span>
      </Link>
    </nav>
  );
}
