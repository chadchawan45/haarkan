"use client";

import React, { useEffect, useState } from "react";

interface HealthData {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  uptimeHuman: string;
  environment: string;
  nodeVersion: string;
  platform: string;
  memoryUsage: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  storage: {
    backend: string;
    storeFileExists: boolean;
    storeSizeBytes: number;
    totalGroups: number;
    totalExpenses: number;
    totalMembers: number;
  };
}

export default function AdminMonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchHealth = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/system/status", { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "ไม่สามารถตรวจสอบสถานะระบบได้");
        setLoading(false);
        return;
      }
      setHealth(data.health);
      setLoading(false);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        setError("การตรวจสอบสถานะหมดเวลา (Timeout 8s) กรุณาลองใหม่อีกครั้ง");
      } else {
        setError(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleBackupDownload = async () => {
    try {
      const res = await fetch("/api/groups/sync");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `haarkan_backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์สำรอง");
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`คำเตือน: คุณต้องการกู้คืนข้อมูลจากไฟล์ "${file.name}" ใช่หรือไม่?\nการดำเนินการนี้จะอัปเดตและเขียนทับข้อมูลในระบบด้วยข้อมูลในไฟล์`)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setRestoring(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch("/api/admin/system/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "ไม่สามารถกู้คืนข้อมูลได้");
        setRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      alert("กู้คืนข้อมูลจากไฟล์สำรองสำเร็จเรียบร้อยแล้ว!");
      fetchHealth();
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: ไฟล์สำรองข้อมูลอาจเสียหายหรือไม่ตรงรูปแบบ JSON");
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            ตรวจสอบสถานะระบบ (System Monitoring)
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted, #94a3b8)", marginTop: "4px", margin: 0 }}>
            ตรวจสอบความพร้อมของ API, ฐานข้อมูล, การใช้หน่วยความจำ และระบบสำรองข้อมูล
          </p>
        </div>
        <button
          onClick={fetchHealth}
          style={{
            padding: "8px 16px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
            color: "var(--text-primary, #ffffff)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          🔄 ตรวจสอบสถานะใหม่
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted, #94a3b8)" }}>
          กำลังตรวจสอบสถานะการทำงานของระบบ...
        </div>
      ) : error || !health ? (
        <div style={{ padding: "24px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "14px", color: "#fca5a5" }}>
          <p style={{ margin: "0 0 12px", fontWeight: 600 }}>⚠️ {error || "ไม่สามารถเชื่อมต่อระบบตรวจสอบสถานะได้"}</p>
          <button
            onClick={fetchHealth}
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
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Status Overview Banner */}
          <div
            style={{
              padding: "20px 24px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 12px #10b981",
                }}
              />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#10b981" }}>
                  ระบบทำงานปกติ (All Systems Operational)
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)", marginTop: "2px" }}>
                  เซิร์ฟเวอร์เปิดใช้งานมาแล้ว: {health.uptimeHuman}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)" }}>
              ตรวจสอบล่าสุด: {new Date(health.timestamp).toLocaleTimeString("th-TH")}
            </div>
          </div>

          {/* METRIC GRIDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Box 1: Runtime & Environment */}
            <div
              style={{
                padding: "24px",
                background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                borderRadius: "16px",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0" }}>
                ⚙️ สภาพแวดล้อมระบบ (Runtime)
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>Environment:</span>
                  <span style={{ fontWeight: 600 }}>{health.environment}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>Node.js Version:</span>
                  <span style={{ fontFamily: "monospace" }}>{health.nodeVersion}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>OS Platform:</span>
                  <span>{health.platform}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>Server Uptime:</span>
                  <span>{health.uptimeSeconds.toLocaleString()} วินาที</span>
                </div>
              </div>
            </div>

            {/* Box 2: Memory & Storage */}
            <div
              style={{
                padding: "24px",
                background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                borderRadius: "16px",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0" }}>
                💾 การใช้ทรัพยากร (Memory & Storage)
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>Memory RSS:</span>
                  <span>{health.memoryUsage.rssMb} MB</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>Heap Used / Total:</span>
                  <span>{health.memoryUsage.heapUsedMb} MB / {health.memoryUsage.heapTotalMb} MB</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>Storage Engine:</span>
                  <span style={{ fontWeight: 600, color: "#38bdf8" }}>{health.storage.backend}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted, #94a3b8)" }}>Store Size:</span>
                  <span>{(health.storage.storeSizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>
          </div>

          {/* BACKUP & RESTORE SECTION */}
          <div
            style={{
              padding: "24px",
              background: "var(--bg-card, rgba(255, 255, 255, 0.04))",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
              borderRadius: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0" }}>
                  📦 ระบบสำรองข้อมูลฉุกเฉิน (Instant Snapshot Backup)
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted, #94a3b8)", margin: 0 }}>
                  ดาวน์โหลดไฟล์สำรองข้อมูล Snapshot JSON (กลุ่ม สมาชิก รายจ่าย และการชำระเงินทั้งหมด) ทันที
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  style={{ display: "none" }}
                  onChange={handleRestoreFile}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoring}
                  style={{
                    padding: "10px 18px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: restoring ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>📥</span>
                  <span>{restoring ? "กำลังกู้คืนข้อมูล..." : "กู้คืนข้อมูลจากไฟล์ (Restore)"}</span>
                </button>

                <button
                  onClick={handleBackupDownload}
                  style={{
                    padding: "10px 18px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "none",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>💾</span>
                  <span>ดาวน์โหลดสำรองข้อมูล (JSON)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
