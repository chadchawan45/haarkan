"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGroup, SplitMode } from "@/lib/group-context";
import { formatTHB, parseTHB, equalSplit, customSplit, weightedSplit } from "@/lib/money";
import { Navbar } from "@/components/Navbar";

const CATEGORIES = [
  { id: "cat-food", name: "อาหาร", icon: "🍜" },
  { id: "cat-drink", name: "น้ำดื่ม", icon: "💧" },
  { id: "cat-supplies", name: "ของใช้ส่วนกลาง", icon: "🛒" },
  { id: "cat-other", name: "อื่น ๆ", icon: "📦" },
];

export default function NewExpensePage() {
  const router = useRouter();
  const { members, activeMembers, currentMemberId, currentMember, isAdmin, isDemo, addExpense } = useGroup();

  const [title, setTitle] = useState("");
  const [bahtInput, setBahtInput] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [mode, setMode] = useState<SplitMode>("equal");
  const [note, setNote] = useState("");

  // ผู้ร่วมรับผิดชอบ
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    activeMembers.map((m) => m.id)
  );

  // ผู้จ่ายเงิน (Multiple Payers)
  const [selectedPayers, setSelectedPayers] = useState<string[]>([currentMemberId]);
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({
    [currentMemberId]: "",
  });

  // Custom & Weighted amounts
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});

  const totalSatang = parseTHB(bahtInput) ?? 0;

  // Auto-fill ยอดผู้จ่าย ถ้ามีคนจ่ายคนเดียว
  const handleBahtChange = (val: string) => {
    setBahtInput(val);
    if (selectedPayers.length === 1) {
      setPayerAmounts({ [selectedPayers[0]]: val });
    }
  };

  // รวมยอดผู้จ่ายทั้งหมด
  const totalPaidSatang = selectedPayers.reduce(
    (sum, id) => sum + (parseTHB(payerAmounts[id] ?? "0") ?? 0),
    0
  );

  // คำนวณส่วนแบ่งการหารแบบ Real-time
  const splitResult = useMemo(() => {
    if (!totalSatang || !selectedParticipants.length) {
      return { rows: [], error: "กรุณาระบุจำนวนเงินและเลือกผู้ร่วมรับผิดชอบอย่างน้อย 1 คน" };
    }

    try {
      if (mode === "equal") {
        return { rows: equalSplit(totalSatang, selectedParticipants), error: "" };
      }
      if (mode === "custom") {
        const shares = selectedParticipants.map((id) => ({
          memberId: id,
          amountSatang: parseTHB(customShares[id] ?? "0") ?? -1,
        }));
        return { rows: customSplit(totalSatang, shares), error: "" };
      }
      if (mode === "weighted") {
        const weightRows = selectedParticipants.map((id) => ({
          memberId: id,
          weight: Number(weights[id] || 1),
        }));
        return { rows: weightedSplit(totalSatang, weightRows), error: "" };
      }
      return { rows: [], error: "ไม่พบวิธีหาร" };
    } catch (e: any) {
      return { rows: [], error: e.message || "การคำนวณไม่ถูกต้อง" };
    }
  }, [totalSatang, selectedParticipants, mode, customShares, weights]);

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const togglePayer = (id: string) => {
    setSelectedPayers((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // ถ้าเหลือคนเดียว ให้ใส่ยอดเต็ม
      if (next.length === 1) {
        setPayerAmounts({ [next[0]]: bahtInput });
      }
      return next;
    });
  };

  const isPayerTotalValid = totalSatang > 0 && totalPaidSatang === totalSatang;
  const isFormValid =
    title.trim().length > 0 &&
    totalSatang > 0 &&
    isPayerTotalValid &&
    selectedParticipants.length > 0 &&
    !splitResult.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !isFormValid) return;

    const category = CATEGORIES.find((c) => c.id === categoryId);

    const payers = selectedPayers.map((id) => ({
      memberId: id,
      amountSatang: parseTHB(payerAmounts[id] ?? "0") ?? 0,
    }));

    addExpense({
      title: title.trim(),
      expenseDate,
      totalAmountSatang: totalSatang,
      categoryId,
      categoryName: category?.name ?? "ทั่วไป",
      splitMode: mode,
      note: note.trim() || undefined,
      payers,
      shares: splitResult.rows,
    });

    router.push("/expenses");
  };

  if (!isAdmin && !isDemo) {
    return (
      <main className="shell">
        <Navbar />
        <div className="card" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
          <h2 style={{ color: "#d9483b" }}>🔒 จำกัดสิทธิ์เฉพาะผู้ดูแลกลุ่ม (Admin Only)</h2>
          <p style={{ color: "#666", lineHeight: 1.6, margin: "14px 0 24px" }}>
            ตามข้อกำหนดของระบบ เฉพาะผู้ดูแลกลุ่ม (Admin) เท่านั้นที่สามารถบันทึกรายจ่ายใหม่ของกลุ่มได้
            บัญชีของคุณคือ <strong>{currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name} (สมาชิกทั่วไป)</strong>
            <br />
            หากคุณต้องการบันทึกรายจ่าย กรุณาติดต่อผู้ดูแลกลุ่ม หรือเข้าสู่ระบบด้วยบัญชีผู้ดูแล
          </p>
          <Link href="/" className="primary">
            ← กลับหน้าภาพรวม
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <Navbar />

      {isDemo && (
        <div
          style={{
            background: "#e7f4ed",
            border: "1px solid #c9ebd8",
            color: "#1f6f53",
            borderRadius: "12px",
            padding: "12px 18px",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "20px" }}>⚡</span>
          <span>
            <strong>โหมดทดลองใช้งาน (Demo Mode):</strong> ฟังก์ชันนี้เปิดให้ทดลองใช้งานได้เต็มรูปแบบ 100%!
            คุณสามารถกรอกยอดเงิน เลือกผู้จ่าย และเลือกรูปแบบการหาร (เท่ากัน / กำหนดเอง / ถ่วงน้ำหนัก) เพื่อทดสอบการคำนวณและปัดเศษสตางค์ได้ทันที
          </span>
        </div>
      )}

      <section className="intro">
        <div>
          <p className="eyebrow">บันทึกค่าใช้จ่ายกลุ่ม · สิทธิ์ Admin</p>
          <h1>เพิ่มรายจ่ายใหม่</h1>
        </div>
        <Link href="/expenses" className="secondary">
          ← ยกเลิกและกลับ
        </Link>
      </section>

      <div className="content-2col">
        {/* ฟอร์มกรอกข้อมูล */}
        <form className="card" onSubmit={handleSubmit}>
          <div className="section-title">รายละเอียดรายการ</div>

          <label className="field">
            ชื่อรายการ
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ค่าอาหารเย็น, ค่าทิชชู่"
              required
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              จำนวนเงิน (บาท)
              <input
                type="text"
                inputMode="decimal"
                value={bahtInput}
                onChange={(e) => handleBahtChange(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label className="field">
              วันที่เกิดรายจ่าย
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              หมวดหมู่
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              วิธีการหาร
              <select value={mode} onChange={(e) => setMode(e.target.value as SplitMode)}>
                <option value="equal">หารเท่ากัน (Equal Split)</option>
                <option value="custom">กำหนดจำนวนเงินเอง (Custom)</option>
                <option value="weighted">แบ่งตามสัดส่วนน้ำหนัก (Weighted)</option>
              </select>
            </label>
          </div>

          <label className="field">
            หมายเหตุ (ไม่บังคับ)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ร้านส้มตำ, หาร 4 คน"
            />
          </label>

          {/* ส่วนระบุผู้จ่ายเงินจริง (Multiple Payers) */}
          <div className="section-title" style={{ marginTop: "24px" }}>
            <span>ผู้สำรองจ่ายจริง</span>
            <small>ต้องรวมให้ได้ {formatTHB(totalSatang)}</small>
          </div>

          {activeMembers.map((m) => (
            <div className="member-check-row" key={m.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedPayers.includes(m.id)}
                  onChange={() => togglePayer(m.id)}
                />
                <span>{m.name}</span>
              </label>

              {selectedPayers.includes(m.id) && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mini-input"
                    value={payerAmounts[m.id] ?? ""}
                    onChange={(e) =>
                      setPayerAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                    placeholder="บาท"
                  />
                  <span style={{ fontSize: "12px", color: "#666" }}>฿</span>
                </div>
              )}
            </div>
          ))}

          <p
            style={{
              fontSize: "13px",
              marginTop: "8px",
              fontWeight: 600,
              color: isPayerTotalValid ? "#168a5f" : "#cf4f36",
            }}
          >
            ยอดรวมผู้จ่าย: {formatTHB(totalPaidSatang)}{" "}
            {isPayerTotalValid ? "✓ ถูกต้อง" : `(ขาด/เกิน ${formatTHB(Math.abs(totalSatang - totalPaidSatang))})`}
          </p>

          {/* ส่วนระบุผู้ร่วมรับผิดชอบค่าใช้จ่าย */}
          <div className="section-title" style={{ marginTop: "24px" }}>
            <span>ผู้ร่วมรับผิดชอบค่าใช้จ่าย</span>
            <small>เลือกสมาชิกที่ต้องหาร</small>
          </div>

          {activeMembers.map((m) => (
            <div className="member-check-row" key={m.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(m.id)}
                  onChange={() => toggleParticipant(m.id)}
                />
                <span>{m.name}</span>
              </label>

              {selectedParticipants.includes(m.id) && (
                <div>
                  {mode === "equal" && <small style={{ color: "#666" }}>หารเท่ากัน</small>}
                  {mode === "custom" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="mini-input"
                        value={customShares[m.id] ?? ""}
                        onChange={(e) =>
                          setCustomShares((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                        placeholder="บาท"
                      />
                      <span style={{ fontSize: "12px", color: "#666" }}>฿</span>
                    </div>
                  )}
                  {mode === "weighted" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#666" }}>น้ำหนัก:</span>
                      <input
                        type="number"
                        min="1"
                        className="mini-input"
                        style={{ width: "70px" }}
                        value={weights[m.id] ?? "1"}
                        onChange={(e) =>
                          setWeights((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            className="primary full-btn"
            disabled={!isFormValid}
            style={{ marginTop: "24px" }}
          >
            บันทึกรายจ่ายเข้าระบบ
          </button>
        </form>

        {/* พรีวิวผลการคำนวณ */}
        <aside className="card" style={{ alignSelf: "flex-start" }}>
          <div className="section-title">
            <span>ตัวอย่างผลการหาร</span>
            <small>ยอดรวม {formatTHB(totalSatang)}</small>
          </div>

          {splitResult.rows.length > 0 ? (
            <div>
              {splitResult.rows.map((r) => {
                const member = members.find((m) => m.id === r.memberId);
                return (
                  <div className="breakdown-row" key={r.memberId}>
                    <span>{member?.name}</span>
                    <strong style={{ color: "#1f6f53" }}>{formatTHB(r.amountSatang)}</strong>
                  </div>
                );
              })}

              <div className="notice" style={{ marginTop: "16px" }}>
                {mode === "equal" && (
                  <p style={{ margin: 0 }}>
                    💡 <strong>กฎการจัดการเศษสตางค์:</strong> ยอดเศษสตางค์จะถูกกระจายให้สมาชิกตามลำดับชื่อที่แน่นอนอย่างเที่ยงตรง ผลรวมตรงยอด 100%
                  </p>
                )}
                {mode === "custom" && (
                  <p style={{ margin: 0 }}>
                    💡 <strong>การกำหนดเอง:</strong> ผลรวมของทุกคนต้องเท่ากับ {formatTHB(totalSatang)} พอดีเป๊ะ
                  </p>
                )}
                {mode === "weighted" && (
                  <p style={{ margin: 0 }}>
                    💡 <strong>การปัดเศษสัดส่วน:</strong> คำนวณตามอัตราส่วนน้ำหนัก และปัดเศษคงเหลือให้คนสุดท้าย ยอดรวมไม่คลาดเคลื่อน
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">{splitResult.error}</div>
          )}
        </aside>
      </div>
    </main>
  );
}
