"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

const NAV_ITEMS = [
  { label: "ภาพรวมระบบ", href: "/admin", icon: "📊" },
  { label: "จัดการสมาชิก", href: "/admin/users", icon: "👥" },
  { label: "จัดการกลุ่มและข้อมูล", href: "/admin/groups", icon: "🏢" },
  { label: "ส่งแจ้งเตือน/ประกาศ", href: "/admin/notifications", icon: "🔔" },
  { label: "ประวัติ Audit Logs", href: "/admin/audit-logs", icon: "📜" },
  { label: "รายงานและส่งออก", href: "/admin/reports", icon: "📈" },
  { label: "ตรวจสอบระบบ", href: "/admin/monitoring", icon: "🛠️" },
  { label: "ตั้งค่าเว็บไซต์", href: "/admin/settings", icon: "⚙️" },
];

const ROLE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  super_admin: { label: "Super Admin", bg: "rgba(16, 185, 129, 0.15)", color: "#10b981" },
  admin: { label: "Admin", bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
  editor: { label: "Editor", bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
  support: { label: "Support", bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" },
  analyst: { label: "Analyst", bg: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  const checkAuth = React.useCallback(async () => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setAuthError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("/api/admin/auth/me", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await res.json();
      if (data.success && data.user) {
        setAdminUser(data.user);
        setLoading(false);
      } else {
        router.replace("/admin/login");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        setAuthError("การตรวจสอบสิทธิ์หมดเวลา (Timeout 8s) กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
      } else {
        setAuthError(err?.message || "ไม่สามารถเชื่อมต่อระบบหลังบ้านได้ กรุณาลองใหม่อีกครั้ง");
      }
      setLoading(false);
    }
  }, [isLoginPage, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {}
    router.replace("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-main, #0f172a)",
          color: "var(--text-primary, #f8fafc)",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(16, 185, 129, 0.2)",
            borderTopColor: "#10b981",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)" }}>
          กำลังตรวจสอบสิทธิ์การเข้าสู่ระบบหลังบ้าน...
        </p>
      </div>
    );
  }

  if (authError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-main, #0f172a)",
          color: "var(--text-primary, #f8fafc)",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "#f87171" }}>
            ไม่สามารถเชื่อมต่อระบบหลังบ้าน
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", margin: "0 0 24px", lineHeight: 1.5 }}>
            {authError}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={checkAuth}
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🔄 ลองใหม่อีกครั้ง
            </button>
            <button
              onClick={() => router.replace("/admin/login")}
              style={{
                padding: "10px 20px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const roleStyle = ROLE_LABELS[adminUser?.role || "admin"] || ROLE_LABELS.admin;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-main, #0b1120)",
        color: "var(--text-primary, #f1f5f9)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {/* SIDEBAR DESKTOP */}
      <aside
        style={{
          width: "260px",
          borderRight: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          background: "var(--bg-card, rgba(15, 23, 42, 0.8))",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 40,
        }}
        className="admin-sidebar-desktop"
      >
        {/* Sidebar Brand Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.01em" }}>
              หารกัน Admin
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
              ระบบควบคุมหลังบ้าน
            </div>
          </div>
        </div>

        {/* Sidebar Menu Links */}
        <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#ffffff" : "var(--text-muted, #94a3b8)",
                  background: isActive
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? "0 4px 12px rgba(16, 185, 129, 0.25)" : "none",
                }}
              >
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#1f6f53",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              {adminUser?.name?.charAt(0) || "A"}
            </div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {adminUser?.name}
              </div>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "99px",
                  background: roleStyle.bg,
                  color: roleStyle.color,
                  fontWeight: 600,
                  marginTop: "2px",
                }}
              >
                {roleStyle.label}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 50,
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: "280px",
              height: "100%",
              background: "var(--bg-card, #0f172a)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontWeight: 700, fontSize: "16px" }}>เมนูผู้ดูแล</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: pathname === item.href ? 600 : 500,
                    color: pathname === item.href ? "#ffffff" : "#94a3b8",
                    background: pathname === item.href ? "#10b981" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* TOPBAR */}
        <header
          style={{
            height: "64px",
            borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            background: "var(--bg-card, rgba(15, 23, 42, 0.6))",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Hamburger Button on Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="admin-hamburger-btn"
              style={{
                display: "none",
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                color: "var(--text-primary, #ffffff)",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ☰
            </button>
            <div style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)" }}>
              Admin Portal /{" "}
              <span style={{ color: "var(--text-primary, #ffffff)", fontWeight: 600 }}>
                {NAV_ITEMS.find((n) => n.href === pathname)?.label || "ระบบหลังบ้าน"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/"
              target="_blank"
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                color: "var(--text-muted, #94a3b8)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>ดูหน้าเว็บ</span>
              <span>↗</span>
            </Link>

            <ThemeToggle />

            <button
              onClick={handleLogout}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#fca5a5",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ padding: "28px", flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .admin-sidebar-desktop {
            display: none !important;
          }
          .admin-hamburger-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
