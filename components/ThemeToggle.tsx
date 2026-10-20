"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch before client mount
    return (
      <button
        className="theme-toggle-btn icon-btn"
        aria-label="เปลี่ยนธีม"
        style={{ opacity: 0.5 }}
      >
        <span>🌓</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      className={`theme-toggle-btn ${showLabel ? "theme-toggle-with-label" : "icon-btn"}`}
      onClick={toggleTheme}
      title={isDark ? "เปลี่ยนเป็นธีมสว่าง (Light Theme)" : "เปลี่ยนเป็นธีมมืด (Dark Theme)"}
      aria-label={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
    >
      <span className={`theme-toggle-icon ${isDark ? "rotate-dark" : "rotate-light"}`}>
        {isDark ? "☀️" : "🌙"}
      </span>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? "ธีมสว่าง" : "ธีมมืด"}
        </span>
      )}
    </button>
  );
}
