"use client";

import React, { useEffect, useState } from "react";

interface SiteSettingsForm {
  siteName: string;
  tagline: string;
  contactEmail: string;
  maintenanceMode: boolean;
  announcement: {
    active: boolean;
    title: string;
    content: string;
    type: "info" | "warning" | "alert";
  };
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSettingsForm>({
    siteName: "หารกัน (HaarKan)",
    tagline: "ระบบจัดการแชร์ค่าใช้จ่ายและเคลียร์เงินในกลุ่ม",
    contactEmail: "",
    maintenanceMode: false,
    announcement: {
      active: false,
      title: "",
      content: "",
      type: "info",
    },
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("/api/admin/settings", { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoadError(data.message || "ไม่สามารถโหลดการตั้งค่าระบบได้");
        setLoading(false);
        return;
      }
      if (data.settings) {
        setForm({
          siteName: data.settings.siteName || "หารกัน (HaarKan)",
          tagline: data.settings.tagline || "",
          contactEmail: data.settings.contactEmail || "",
          maintenanceMode: !!data.settings.maintenanceMode,
          announcement: data.settings.announcement || {
            active: false,
            title: "",
            content: "",
            type: "info",
          },
        });
      }
      setLoading(false);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        setLoadError("การโหลดการตั้งค่าหมดเวลา (Timeout 8s) กรุณาลองใหม่อีกครั้ง");
      } else {
        setLoadError(err?.message || "เกิดข้อผิดพลาดในการโหลดการตั้งค่า");
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.message || "ไม่สามารถบันทึกการตั้งค่าได้" });
        setSaving(false);
        return;
      }
      setFeedback({ type: "success", text: "บันทึกการตั้งค่าเว็บไซต์และเนื้อหาสำเร็จเรียบร้อยแล้ว!" });
      setSaving(false);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "เกิดข้อผิดพลาดในการบันทึก" });
      setSaving(false);
    }
  };

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
        กำลังโหลดการตั้งค่าระบบ...
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          padding: "24px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          borderRadius: "14px",
          color: "#fca5a5",
          maxWidth: "600px",
        }}
      >
        <p style={{ margin: "0 0 12px", fontWeight: 600 }}>⚠️ {loadError}</p>
        <button
          onClick={fetchSettings}
          style={{
            padding: "8px 16px",
            background: "#ef4444",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🔄 ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          ตั้งค่าเว็บไซต์และเนื้อหา (Site & Content Settings)
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
          ปรับแต่งชื่อเว็บไซต์ คำอธิบาย อีเมลติดต่อ และแบนเนอร์ประกาศสำหรับผู้ใช้งาน
        </p>
      </div>

      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "14px",
            background: feedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: feedback.type === "success" ? "#86efac" : "#fca5a5",
          }}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* CARD 1: GENERAL SETTINGS */}
        <div
          style={{
            padding: "24px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
            🌐 ข้อมูลทั่วไปของเว็บไซต์ (General Settings)
          </h2>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              ชื่อเว็บไซต์ (Site Name)
            </label>
            <input
              type="text"
              required
              value={form.siteName}
              onChange={(e) => setForm((prev) => ({ ...prev, siteName: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                borderRadius: "8px",
                color: "var(--text-primary, #ffffff)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              สโลแกน / คำอธิบายเว็บไซต์ (Tagline)
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                borderRadius: "8px",
                color: "var(--text-primary, #ffffff)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              อีเมลติดต่อฝ่ายสนับสนุน (Contact Email)
            </label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                borderRadius: "8px",
                color: "var(--text-primary, #ffffff)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* CARD 2: ANNOUNCEMENT BANNER */}
        <div
          style={{
            padding: "24px",
            background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              📢 แถบประกาศหน้าเว็บไซต์ (Announcement Banner)
            </h2>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={form.announcement.active}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    announcement: { ...prev.announcement, active: e.target.checked },
                  }))
                }
              />
              <span>เปิดใช้งานแถบประกาศ</span>
            </label>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              หัวข้อประกาศ
            </label>
            <input
              type="text"
              placeholder="เช่น ปรับปรุงระบบประจำสัปดาห์, อัปเดตฟีเจอร์ใหม่"
              value={form.announcement.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  announcement: { ...prev.announcement, title: e.target.value },
                }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                borderRadius: "8px",
                color: "var(--text-primary, #ffffff)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              เนื้อหาข้อความประกาศ
            </label>
            <textarea
              rows={3}
              placeholder="ข้อความที่จะแสดงที่แถบด้านบนของเว็บไซต์สำหรับสมาชิกทุกคน..."
              value={form.announcement.content}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  announcement: { ...prev.announcement, content: e.target.value },
                }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                borderRadius: "8px",
                color: "var(--text-primary, #ffffff)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              ประเภทแถบประกาศ
            </label>
            <select
              value={form.announcement.type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  announcement: {
                    ...prev.announcement,
                    type: e.target.value as "info" | "warning" | "alert",
                  },
                }))
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
                borderRadius: "8px",
                color: "var(--text-primary, #ffffff)",
                fontSize: "14px",
              }}
            >
              <option value="info">ข้อมูลทั่วไป (สีฟ้า/น้ำเงิน)</option>
              <option value="warning">คำเตือน (สีเหลือง/ส้ม)</option>
              <option value="alert">แจ้งเหตุด่วน (สีแดง)</option>
            </select>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 8px 16px rgba(16, 185, 129, 0.25)",
            }}
          >
            {saving ? "กำลังบันทึกข้อมูล..." : "💾 บันทึกการตั้งค่าทั้งหมด"}
          </button>
        </div>
      </form>
    </div>
  );
}
