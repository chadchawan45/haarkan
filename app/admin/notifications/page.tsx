"use client";

import React, { useState, useEffect } from "react";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("announcement");
  const [link, setLink] = useState("/");
  const [sending, setSending] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  const fetchRecent = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("/api/groups/sync", { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setRecentNotifications(data.notifications.slice(0, 15));
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name !== "AbortError") {
        console.debug("Fetch recent notifications failed:", err?.message);
      }
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      alert("กรุณากรอกหัวข้อและเนื้อหาการแจ้งเตือน");
      return;
    }

    try {
      setSending(true);
      setFeedback(null);

      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
          link: link.trim() || "/",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.message || "ไม่สามารถส่งการแจ้งเตือนได้" });
        setSending(false);
        setConfirmModal(false);
        return;
      }

      setFeedback({ type: "success", text: data.message || "ส่งการแจ้งเตือนถึงสมาชิกทุกคนสำเร็จแล้ว!" });
      setTitle("");
      setBody("");
      setConfirmModal(false);
      setSending(false);
      fetchRecent();
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
      setSending(false);
      setConfirmModal(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "900px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          ส่งแจ้งเตือนและประกาศ (Broadcast Notifications)
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
          ส่งข้อความแจ้งเตือนสำคัญเข้ากระดิ่งแจ้งเตือนของสมาชิกทุกคนในระบบแบบเรียลไทม์
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

      {/* FORM CARD */}
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
          📝 ร่างข้อความแจ้งเตือนใหม่ (New Notification)
        </h2>

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
            หัวข้อแจ้งเตือน (Title) *
          </label>
          <input
            type="text"
            required
            placeholder="เช่น อัปเดตระบบใหม่, แจ้งเตือนปิดปรับปรุงชั่วคราว"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            ข้อความรายละเอียด (Body) *
          </label>
          <textarea
            required
            rows={4}
            placeholder="กรอกข้อความที่ต้องการแจ้งให้สมาชิกทุกคนทราบ..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              ประเภทข้อความ (Type)
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
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
              <option value="announcement">📢 ประกาศข่าวสารทั่วไป (Announcement)</option>
              <option value="system_alert">⚠️ แจ้งเตือนระบบ (System Alert)</option>
              <option value="feature_update">✨ แนะนำฟีเจอร์ใหม่ (Feature Update)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              ลิงก์เมื่อคลิก (Link Destination)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="เช่น /expenses หรือ /balances หรือ /"
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

        <div>
          <button
            type="button"
            onClick={() => {
              if (!title.trim() || !body.trim()) {
                alert("กรุณากรอกหัวข้อและเนื้อหา");
                return;
              }
              setConfirmModal(true);
            }}
            disabled={sending}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 16px rgba(16, 185, 129, 0.25)",
            }}
          >
            🚀 ส่งแจ้งเตือนถึงสมาชิกทุกคน
          </button>
        </div>
      </div>

      {/* RECENT NOTIFICATIONS LIST */}
      <div
        style={{
          padding: "24px",
          background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0" }}>
          📜 ประวัติการแจ้งเตือนล่าสุดในระบบ (Recent Notifications)
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: "12px 16px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>
                    🔔 {notif.title}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", marginTop: "4px" }}>
                    {notif.body}
                  </div>
                  {notif.link && (
                    <div style={{ fontSize: "11px", color: "#38bdf8", marginTop: "4px" }}>
                      ลิงก์: {notif.link}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", whiteSpace: "nowrap" }}>
                  {new Date(notif.createdAt).toLocaleString("th-TH")}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted, #94a3b8)", padding: "20px" }}>
              ยังไม่มีประวัติการส่งแจ้งเตือน
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
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
          onClick={() => setConfirmModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "var(--bg-card, #0f172a)",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
              borderRadius: "16px",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 10px 0" }}>
              📢 ยืนยันการส่งการแจ้งเตือน
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", margin: "0 0 16px 0" }}>
              คุณต้องการส่งแจ้งเตือน <strong>&ldquo;{title}&rdquo;</strong> ถึงสมาชิกทุกคนในระบบใช่หรือไม่?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setConfirmModal(false)}
                disabled={sending}
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBroadcast}
                disabled={sending}
                style={{
                  padding: "8px 16px",
                  background: "#10b981",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "กำลังส่ง..." : "ยืนยันการส่ง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
