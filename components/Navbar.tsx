"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGroup } from "@/lib/group-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DemoBanner } from "@/components/DemoBanner";
import { SiteAnnouncementBanner } from "@/components/SiteAnnouncementBanner";
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
  } = useGroup();

  const [showNotifs, setShowNotifs] = useState(false);

  const isSystemAdmin =
    currentMember?.id === "mem-golf" ||
    currentMember?.email?.toLowerCase() === "golf2545mc@gmail.com";

  const navItems = isAuthenticated
    ? isDemo
      ? [
          { label: "หน้าหลัก", href: "/" },
          { label: "รายจ่าย (เปิดใช้)", href: "/expenses" },
          { label: "🔒 เคลียร์เงิน", href: "/balances" },
          ...(isGroupCreator ? [{ label: "🔒 ตั้งค่ากลุ่ม", href: "/settings" }] : []),
          ...(isSystemAdmin ? [{ label: "🛡️ หลังบ้าน", href: "/admin" }] : []),
        ]
      : [
          { label: "หน้าหลัก", href: "/" },
          { label: "รายจ่าย", href: "/expenses" },
          { label: "เคลียร์เงิน & ชำระหนี้", href: "/balances" },
          ...(isGroupCreator ? [{ label: "⚙️ ตั้งค่ากลุ่ม", href: "/settings" }] : []),
          ...(isSystemAdmin ? [{ label: "🛡️ หลังบ้าน", href: "/admin" }] : []),
        ]
    : [
        { label: "หน้าหลัก", href: "/" },
        { label: "จุดเด่น & ฟังก์ชัน", href: "/#features" },
        { label: "วิธีใช้งาน", href: "/#how-it-works" },
        { label: "ทดลองคำนวณ", href: "/#try-calculator" },
      ];

  return (
    <header>
      {/* แถบประกาศสำคัญจากผู้ดูแลระบบ */}
      <SiteAnnouncementBanner />

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
          {/* ปุ่มสลับธีมมืด / ธีมสว่าง */}
          <ThemeToggle />

          {/* โปรไฟล์ & เข้าสู่ระบบ / ออกจากระบบ */}
          {isAuthenticated ? (
            <>
              <button
                className="secondary desktop-only"
                onClick={logout}
                style={{
                  padding: "6px 12px",
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
                  aria-label="การแจ้งเตือน"
                >
                  🔔
                  {unreadNotificationCount > 0 && (
                    <span className="badge-dot">{unreadNotificationCount}</span>
                  )}
                </button>

                {showNotifs && (
                  <div className="notification-dropdown">
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
                              background: n.read ? "transparent" : "rgba(39, 174, 96, 0.12)",
                              marginBottom: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            <div style={{ fontWeight: 600, color: n.read ? "var(--text-muted)" : "var(--primary)" }}>
                              {n.title}
                            </div>
                            <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>{n.body}</div>
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
                  cursor: "pointer",
                  borderRadius: "50%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                title={`โปรไฟล์: ${currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name} (คลิกเพื่อแก้ไขโปรไฟล์)`}
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

      {/* แถบเมนูหลัก (แสดงเฉพาะ Desktop เมื่อล็อกอินแล้ว เพื่อไม่ให้ซ้อนทับกับ Mobile Bottom Nav) */}
      <nav className={`nav-bar ${isAuthenticated ? "desktop-only" : ""}`}>
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

      {/* โมดอลเข้าร่วมกลุ่มด้วยรหัส 6 ตัว */}
      <JoinRoomModal />
    </header>
  );
}
