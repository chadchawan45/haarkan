"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGroup } from "@/lib/group-context";
import { Navbar } from "@/components/Navbar";

export default function RoomsPage() {
  const router = useRouter();
  const {
    groups,
    group,
    switchGroup,
    setJoinModalOpen,
    currentMemberId,
    isAuthenticated,
  } = useGroup();

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <main className="shell">
        <Navbar />
        <div
          className="card"
          style={{
            maxWidth: "500px",
            margin: "60px auto",
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏫</div>
          <h2 style={{ margin: "0 0 10px" }}>กรุณาเข้าสู่ระบบก่อนดูห้องของคุณ</h2>
          <p style={{ color: "#6a766e", lineHeight: 1.6, margin: "0 0 24px" }}>
            เข้าสู่ระบบเพื่อดูห้องเรียนและกลุ่มแชร์ค่าใช้จ่ายที่คุณเข้าร่วม
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/login" className="primary">
              ➔ เข้าสู่ระบบ
            </Link>
            <Link href="/" className="secondary">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSelectRoom = (groupId: string) => {
    switchGroup(groupId);
    router.push("/");
  };

  return (
    <main className="shell">
      <Navbar />

      <section className="intro">
        <div>
          <p className="eyebrow">ระบบห้องแบบ Google Classroom · จัดการหลายกลุ่ม</p>
          <h1>🏫 ห้องทั้งหมดของคุณ ({groups.length} ห้อง)</h1>
          <p style={{ color: "var(--text-muted, #6a766e)", marginTop: "6px", fontSize: "14px" }}>
            เลือกห้องที่ต้องการจัดการบิลและเคลียร์เงิน หรือใช้รหัส 6 หลักในการเข้าร่วมห้องใหม่
          </p>
        </div>

        <div className="actions-row">
          <button
            type="button"
            className="primary"
            onClick={() => setJoinModalOpen(true)}
            style={{
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            🔑 เข้าร่วมห้องด้วยรหัส
          </button>
          <Link
            href="/groups/new"
            className="secondary"
            style={{
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "10px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ＋ สร้างห้องใหม่
          </Link>
        </div>
      </section>

      {/* Classroom Room Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "24px",
          marginTop: "20px",
          marginBottom: "40px",
        }}
      >
        {groups.map((g) => {
          const isActive = g.id === group.id;
          return (
            <div
              key={g.id}
              className="card"
              onClick={() => handleSelectRoom(g.id)}
              style={{
                padding: 0,
                overflow: "hidden",
                cursor: "pointer",
                border: isActive ? "2px solid #1f6f53" : "1px solid var(--border, #e5e7eb)",
                boxShadow: isActive ? "0 10px 28px rgba(31, 111, 83, 0.2)" : "0 4px 14px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
                borderRadius: "18px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header Banner แบบ Google Classroom */}
              <div
                style={{
                  background: g.bannerGradient || "linear-gradient(135deg, #1f6f53 0%, #154c39 100%)",
                  color: "#fff",
                  padding: "22px 20px",
                  minHeight: "115px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#fff",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {g.name}
                    </h3>
                    {isActive && (
                      <span
                        style={{
                          background: "rgba(255,255,255,0.25)",
                          backdropFilter: "blur(4px)",
                          color: "#fff",
                          padding: "3px 10px",
                          borderRadius: "99px",
                          fontSize: "11px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ● เปิดใช้อยู่
                      </span>
                    )}
                  </div>
                  {g.description && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.9)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.description}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.95)", marginTop: "10px" }}>
                  <span>👑 ผู้สร้าง:</span>
                  <strong>{g.creatorMemberId === currentMemberId ? "คุณ (Admin)" : "Admin"}</strong>
                </div>
              </div>

              {/* Body ส่วนแสดงรหัสห้อง 6 หลัก */}
              <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div
                  style={{
                    background: "rgba(31, 111, 83, 0.05)",
                    border: "1px dashed rgba(31, 111, 83, 0.3)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted, #6a766e)", display: "block" }}>
                      รหัสห้อง (Classroom Code)
                    </span>
                    <strong style={{ fontFamily: "monospace", fontSize: "19px", letterSpacing: "3px", color: "#1f6f53" }}>
                      {g.code}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(g.code);
                      setCopiedCodeId(g.id);
                      setTimeout(() => setCopiedCodeId(null), 2000);
                    }}
                    style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "8px", fontWeight: 600 }}
                    title="คัดลอกรหัสห้องส่งให้เพื่อน"
                  >
                    {copiedCodeId === g.id ? "✓ คัดลอกแล้ว!" : "📋 คัดลอกรหัส"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted, #6a766e)" }}>
                    👥 สมาชิกพร้อมแชร์
                  </span>
                  <button
                    type="button"
                    className={isActive ? "primary" : "secondary"}
                    style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 700, borderRadius: "10px" }}
                  >
                    {isActive ? "จัดการห้องนี้ ➔" : "เข้าสู่ห้อง ➔"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
