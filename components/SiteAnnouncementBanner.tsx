"use client";

import React, { useEffect, useState } from "react";

interface AnnouncementData {
  active: boolean;
  title: string;
  content: string;
  type: "info" | "warning" | "alert";
}

const TYPE_STYLES = {
  info: {
    bg: "linear-gradient(90deg, #1e3a8a 0%, #1e40af 100%)",
    border: "#3b82f6",
    text: "#eff6ff",
    icon: "📢",
  },
  warning: {
    bg: "linear-gradient(90deg, #78350f 0%, #92400e 100%)",
    border: "#f59e0b",
    text: "#fffbeb",
    icon: "⚠️",
  },
  alert: {
    bg: "linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)",
    border: "#ef4444",
    text: "#fef2f2",
    icon: "🚨",
  },
};

export function SiteAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem("haarkan_announcement_dismissed");
      if (isDismissed === "true") {
        setDismissed(true);
      }
    } catch {}

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.announcement?.active && data.settings?.announcement?.content) {
          setAnnouncement(data.settings.announcement);
        }
      })
      .catch(() => {});
  }, []);

  if (dismissed || !announcement || !announcement.active || !announcement.content) {
    return null;
  }

  const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.info;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("haarkan_announcement_dismissed", "true");
    } catch {}
  };

  return (
    <div
      style={{
        background: style.bg,
        borderBottom: `1px solid ${style.border}`,
        color: style.text,
        padding: "10px 16px",
        fontSize: "13px",
        position: "relative",
        zIndex: 50,
      }}
    >
      <div
        className="shell"
        style={{
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>{style.icon}</span>
          <div style={{ lineHeight: "1.4" }}>
            {announcement.title && (
              <strong style={{ marginRight: "6px" }}>{announcement.title}:</strong>
            )}
            <span>{announcement.content}</span>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: style.text,
            opacity: 0.8,
            cursor: "pointer",
            fontSize: "16px",
            padding: "2px 6px",
            borderRadius: "4px",
            flexShrink: 0,
          }}
          title="ปิดการแจ้งเตือนนี้"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
