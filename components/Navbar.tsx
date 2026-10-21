"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGroup } from "@/lib/group-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DemoBanner } from "@/components/DemoBanner";
import { JoinRoomModal } from "@/components/JoinRoomModal";

export function Navbar() {
  const pathname = usePathname();
  const {
    group,
    members,
    currentMember,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    isAdmin,
    isGroupCreator,
    isAuthenticated,
    isDemo,
    logout,
    setJoinModalOpen,
  } = useGroup();

  const [showNotifs, setShowNotifs] = useState(false);

  const navItems = isAuthenticated
    ? isDemo
      ? [
          { label: "ภาพรวม", href: "/" },
          { label: "รายจ่าย (เปิดใช้)", href: "/expenses" },
          { label: "🔒 เคลียร์เงิน", href: "/balances" },
          ...(isGroupCreator ? [{ label: "🔒 ตั้งค่ากลุ่ม", href: "/settings" }] : []),
        ]
      : [
          { label: "ภาพรวม", href: "/" },
          { label: "รายจ่าย", href: "/expenses" },
          { label: "เคลียร์เงิน & ชำระหนี้", href: "/balances" },
          ...(isGroupCreator ? [{ label: "⚙️ ตั้งค่ากลุ่ม", href: "/settings" }] : []),
        ]
    : [
        { label: "หน้าแรก", href: "/" },
        { label: "จุดเด่น & ฟังก์ชัน", href: "/#features" },
        { label: "วิธีใช้งาน", href: "/#how-it-works" },
        { label: "ทดลองคำนวณ", href: "/#try-calculator" },
      ];

  return (
    <header>
      {/* แถบแจ้งเตือนสถานะ Demo Mode */}
      <DemoBanner />

      <div className="top">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/" className="brand">
            หาร<i>กัน</i>
          </Link>
          {isDemo && (
            <span
              style={{
                fontSize: "11px",
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fde68a",
                padding: "2px 8px",
                borderRadius: "99px",
                fontWeight: 600,
              }}
            >
              ⚡ เดโม: ปลดล็อกเฉพาะเพิ่มรายจ่าย
            </span>
          )}
        </div>

        <div className="top-right">
          {/* ปุ่มเข้าร่วมห้อง (Classroom Join Room) */}
          <button
            type="button"
            className="secondary"
            onClick={() => setJoinModalOpen(true)}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(31, 111, 83, 0.08)",
              border: "1px solid rgba(31, 111, 83, 0.3)",
              color: "#1f6f53",
              cursor: "pointer",
            }}
            title="กรอกรหัส 6 หลักเพื่อเข้าร่วมห้อง"
          >
            🔑 เข้าร่วมห้อง
          </button>

          {/* ปุ่มสลับธีมมืด / ธีมสว่าง */}
          <ThemeToggle />

          {/* โปรไฟล์ & เข้าสู่ระบบ / ออกจากระบบ */}
          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="secondary"
                style={{
                  padding: "6px 10px",
                  fontSize: "12px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title={isDemo ? "ข้อมูลโปรไฟล์ (ล็อกในโหมด Demo)" : "แก้ไขข้อมูลส่วนตัวและบัญชีรับเงิน"}
              >
                {isDemo ? "🔒 โปรไฟล์" : "👤 โปรไฟล์"}
              </Link>

              <button
                className="secondary"
                onClick={logout}
                style={{
                  padding: "6px 10px",
                  fontSize: "12px",
                  color: "#777",
                  borderRadius: "10px",
                }}
                title="ออกจากระบบ"
              >
                ออกจากระบบ
              </button>

              {/* กระดิ่งแจ้งเตือน */}
              <div style={{ position: "relative" }}>
                <button
                  className="icon-btn"
                  onClick={() => setShowNotifs(!showNotifs)}
                  title="การแจ้งเตือน"
                >
                  🔔
                  {unreadNotificationCount > 0 && (
                    <span className="badge-dot">{unreadNotificationCount}</span>
                  )}
                </button>

                {showNotifs && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "48px",
                      width: "320px",
                      background: "#fff",
                      borderRadius: "14px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      border: "1px solid #e6eae6",
                      padding: "16px",
                      zIndex: 50,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <strong style={{ fontSize: "14px" }}>การแจ้งเตือน</strong>
                      {unreadNotificationCount > 0 && (
                        <button
                          className="link"
                          style={{ fontSize: "12px" }}
                          onClick={markAllNotificationsRead}
                        >
                          อ่านทั้งหมด
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "#8a948c", textAlign: "center", margin: "20px 0" }}>
                          ไม่มีการแจ้งเตือนใหม่
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            style={{
                              padding: "10px",
                              borderRadius: "8px",
                              background: n.read ? "transparent" : "#f0f8f4",
                              marginBottom: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            <div style={{ fontWeight: 600, color: n.read ? "#555" : "#1f6f53" }}>
                              {n.title}
                            </div>
                            <div style={{ color: "#666", marginTop: "2px" }}>{n.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/profile"
                className="avatar"
                style={{
                  background: currentMember.avatarColor,
                  textDecoration: "none",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                title={`โปรไฟล์ของคุณ: ${currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name}`}
              >
                {currentMember.avatarUrl ? (
                  <img
                    src={currentMember.avatarUrl}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  (currentMember.nickname || currentMember.name).slice(0, 1)
                )}
              </Link>
            </>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Link
                href="/login"
                className="secondary"
                style={{
                  padding: "7px 12px",
                  fontSize: "13px",
                  borderRadius: "10px",
                  textDecoration: "none",
                }}
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="primary"
                style={{
                  padding: "7px 14px",
                  fontSize: "13px",
                  borderRadius: "10px",
                  textDecoration: "none",
                }}
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* แถบเมนูหลัก */}
      <nav className="nav-bar">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* โมดอลเข้าร่วมห้องด้วยรหัส 6 ตัว */}
      <JoinRoomModal />
    </header>
  );
}
