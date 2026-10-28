"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGroup, ExpenseRecord } from "@/lib/group-context";
import { formatTHB } from "@/lib/money";
import { Navbar } from "@/components/Navbar";
import { VoidModal } from "@/components/VoidModal";

export default function ExpensesListPage() {
  const { expenses, members, currentMemberId, isAdmin, isDemo, triggerDemoLock } = useGroup();

  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [voidingExpense, setVoidingExpense] = useState<ExpenseRecord | null>(null);

  const categories = Array.from(new Set(expenses.map((e) => e.categoryName)));

  const filteredExpenses = expenses.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (categoryFilter !== "all" && e.categoryName !== categoryFilter) return false;
    if (search.trim() && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="shell">
      <Navbar />

      {isDemo && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            borderRadius: "12px",
            padding: "12px 18px",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚡</span>
            <span>
              <strong>โหมดทดลองใช้งาน (Demo Mode):</strong> คุณสามารถกด <strong>&quot;＋ เพิ่มรายจ่ายใหม่&quot;</strong> เพื่อทดสอบบันทึกรายการได้ทันที (ฟังก์ชันยกเลิกบิลถูกล็อกไว้)
            </span>
          </div>
          <Link
            href="/expenses/new"
            className="primary"
            style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 700 }}
          >
            ＋ เพิ่มรายจ่ายใหม่
          </Link>
        </div>
      )}

      <section className="intro">
        <div>
          <p className="eyebrow">บันทึกและตรวจสอบประวัติรายจ่าย</p>
          <h1>รายการรายจ่ายทั้งหมด</h1>
        </div>

        <Link
          href="/expenses/new"
          className="primary"
          style={{ fontWeight: 700 }}
        >
          ＋ เพิ่มรายจ่ายใหม่
        </Link>
      </section>

      {/* Filter Toolbar */}
      <div className="card filter-toolbar-card" style={{ marginBottom: "20px" }}>
        <div className="filter-toolbar-content">
          <div className="filter-inputs-grid">
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อรายการ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-search-input"
            />

            <div className="filter-selects-row">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">สถานะ: ทั้งหมด</option>
                <option value="active">เฉพาะใช้งานอยู่</option>
                <option value="voided">เฉพาะยกเลิกแล้ว</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">หมวดหมู่: ทั้งหมด</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="filter-count-badge">
            พบ <strong>{filteredExpenses.length}</strong> รายการ
          </span>
        </div>
      </div>

      {/* รายการค่าใช้จ่าย */}
      <div className="content-1col">
        {filteredExpenses.length === 0 ? (
          <div className="card empty-state">ไม่พบรายการรายจ่ายที่ตรงกับเงื่อนไข</div>
        ) : (
          filteredExpenses.map((exp) => {
            const payerNames = exp.payers
              .map((p) => {
                const name = members.find((m) => m.id === p.memberId)?.name ?? "สมาชิก";
                return `${name} (${formatTHB(p.amountSatang)})`;
              })
              .join(", ");

            const myShare = exp.shares.find((s) => s.memberId === currentMemberId)?.amountSatang ?? 0;
            const myPaid = exp.payers.find((p) => p.memberId === currentMemberId)?.amountSatang ?? 0;

            return (
              <div
                className="card"
                key={exp.id}
                style={{
                  opacity: exp.status === "voided" ? 0.7 : 1,
                  borderLeft: exp.status === "voided" ? "4px solid #c0392b" : "4px solid #1f6f53",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "17px", textDecoration: exp.status === "voided" ? "line-through" : "none" }}>
                        {exp.title}
                      </h3>
                      <span className={`badge badge-${exp.status}`}>
                        {exp.status === "active" ? "ใช้งานอยู่" : "ยกเลิกแล้ว"}
                      </span>
                      <span className="badge" style={{ background: "#edf2ef", color: "#486255" }}>
                        {exp.categoryName}
                      </span>
                    </div>

                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#666" }}>
                      📅 วันที่เกิดรายการ: <strong>{exp.expenseDate}</strong> · วิธีหาร:{" "}
                      {exp.splitMode === "equal"
                        ? "หารเท่ากัน"
                        : exp.splitMode === "custom"
                        ? "กำหนดเอง"
                        : "ตามสัดส่วนน้ำหนัก"}
                    </p>

                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}>
                      💳 ผู้สำรองจ่าย: <strong>{payerNames}</strong>
                    </p>

                    {exp.note && (
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#888", fontStyle: "italic" }}>
                        💬 หมายเหตุ: {exp.note}
                      </p>
                    )}

                    {exp.voidReason && (
                      <div
                        style={{
                          marginTop: "8px",
                          background: "#fdf2f2",
                          border: "1px solid #f9d2d2",
                          color: "#c0392b",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      >
                        ⚠️ เหตุผลที่ยกเลิก: {exp.voidReason}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: exp.status === "voided" ? "#999" : "#1f6f53" }}>
                      {formatTHB(exp.totalAmountSatang)}
                    </div>
                    {exp.status === "active" && (
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                        {myPaid > 0 && <span style={{ color: "#168a5f" }}>คุณจ่ายไป {formatTHB(myPaid)} · </span>}
                        {myShare > 0 ? (
                          <span style={{ color: "#cf4f36" }}>ส่วนของคุณ {formatTHB(myShare)}</span>
                        ) : (
                          <span>คุณไม่มีส่วนหารในรายการนี้</span>
                        )}
                      </div>
                    )}

                    {(isAdmin || exp.createdByMemberId === currentMemberId) && exp.status === "active" && (
                      <button
                        className="danger-btn"
                        style={{
                          marginTop: "10px",
                          ...(isDemo ? { opacity: 0.85 } : {}),
                        }}
                        onClick={() =>
                          isDemo ? triggerDemoLock("การยกเลิกบิลรายจ่าย") : setVoidingExpense(exp)
                        }
                        title={isDemo ? "ฟังก์ชันนี้ถูกล็อกในโหมด Demo" : undefined}
                      >
                        {isDemo ? "🔒 ยกเลิกรายการ (ล็อกในเดโม)" : "✕ ยกเลิกรายการ"}
                      </button>
                    )}
                  </div>
                </div>

                {/* แสดงรายละเอียดการแบ่ง (Shares Breakdown) */}
                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #e6eae6" }}>
                  <span style={{ fontSize: "12px", color: "#888", fontWeight: 600 }}>
                    ผู้รับผิดชอบ ({exp.shares.length} คน):
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                    {exp.shares.map((s) => {
                      const m = members.find((x) => x.id === s.memberId);
                      return (
                        <span
                          key={s.memberId}
                          style={{
                            fontSize: "12px",
                            background: s.memberId === currentMemberId ? "#e7f4ed" : "#f5f7f5",
                            border: "1px solid #e0e5e1",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            color: s.memberId === currentMemberId ? "#1f6f53" : "#333",
                            fontWeight: s.memberId === currentMemberId ? 700 : 400,
                          }}
                        >
                          {m?.name}: {formatTHB(s.amountSatang)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <VoidModal expense={voidingExpense} onClose={() => setVoidingExpense(null)} />
    </main>
  );
}
