"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGroup } from "@/lib/group-context";
import { formatTHB, equalSplit, weightedSplit } from "@/lib/money";

export function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, demoLogin, currentMember } = useGroup();

  // State สำหรับ Interactive Calculator Widget บนหน้า Landing
  const [calcAmount, setCalcAmount] = useState<number>(1200);
  const [calcPeople, setCalcPeople] = useState<number>(3);
  const [calcMode, setCalcMode] = useState<"equal" | "weighted">("equal");

  // รายชื่อเพื่อนจำลองสำหรับคำนวณ
  const sampleNames = ["คุณ (กอล์ฟ)", "มินนี่", "พี่ต้น", "นนท์", "พลอย", "บีม"];
  const activeNames = sampleNames.slice(0, calcPeople);

  // คำนวณแบบแม่นยำระดับสตางค์ตามระบบของแอป
  const satang = Math.round(calcAmount * 100);
  const splitRows =
    calcMode === "equal"
      ? equalSplit(satang, activeNames)
      : weightedSplit(
          satang,
          activeNames.map((name, idx) => ({
            memberId: name,
            weight: idx === 0 ? 2 : 1, // คนแรกรับภาระ 2 ส่วน
          }))
        );

  const handleDemoStart = () => {
    demoLogin();
    router.push("/");
  };

  return (
    <div className="landing-container">
      {/* แจ้งเตือนกรณีล็อกอินอยู่แล้วแต่เข้ามาดูหน้าแนะนำ */}
      {isAuthenticated && (
        <div className="landing-auth-banner">
          <span>
            👋 คุณกำลังเข้าสู่ระบบในชื่อ <strong>{currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name}</strong>
          </span>
          <Link href="/" className="primary" style={{ padding: "6px 14px", fontSize: "13px" }}>
            ➔ ไปยังหน้าหลัก (Dashboard)
          </Link>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span className="pulse-dot" />
          ✨ ระบบจัดการค่าใช้จ่ายกลุ่มเวอร์ชันใหม่ · แม่นยำระดับสตางค์ 100%
        </div>

        <h1 className="landing-title">
          จัดการค่าใช้จ่ายกลุ่มให้ลงตัว <br />
          <span className="gradient-text">เคลียร์เงินง่าย ไม่มีเศษสตางค์ตกหล่น</span>
        </h1>

        <p className="landing-subtitle">
          เว็บแอปพลิเคชันภาษาไทยสำหรับกลุ่มเพื่อน รูมเมทบ้านเช่า และทริปท่องเที่ยว 
          บันทึกรายจ่าย คำนวณเศษสตางค์ไม่คลาดเคลื่อน จับคู่หนี้ลดรอบการโอน 
          พร้อมระบบแนบสลิปและยืนยันยอดเงินที่โปร่งใส ตรวจสอบย้อนกลับได้ทุกบิล
        </p>

        <div className="landing-cta-group">
          <button className="hero-demo-prominent-btn" onClick={handleDemoStart}>
            <span className="demo-btn-icon">⚡</span>
            <span className="demo-btn-text">ทดลองใช้งานทันที (Demo)</span>
            <span className="demo-btn-arrow">➔</span>
          </button>
          <div className="hero-demo-subtext">
            <span>✨ ไม่ต้องสมัครสมาชิก · ลองเพิ่มรายจ่ายและคำนวณเศษสตางค์ได้ทันที</span>
          </div>
        </div>

        {/* Hero Highlights Pill Bar */}
        <div className="hero-stats-bar">
          <div className="stat-pill">
            <span className="pill-icon">🎯</span>
            <div>
              <strong>คำนวณเงินระดับสตางค์</strong>
              <small>ไม่ใช้ Floating Point เศษตรง 100%</small>
            </div>
          </div>
          <div className="stat-pill">
            <span className="pill-icon">🔄</span>
            <div>
              <strong>จับคู่หนี้สุทธิ (Optimized)</strong>
              <small>ลดจำนวนครั้งการโอนเงินให้น้อยที่สุด</small>
            </div>
          </div>
          <div className="stat-pill">
            <span className="pill-icon">🧾</span>
            <div>
              <strong>แนบสลิป & ยืนยันยอด</strong>
              <small>ผู้รับเงินกดยืนยัน หนี้ลดลงทันที</small>
            </div>
          </div>
        </div>
      </section>

      {/* --- INTERACTIVE CALCULATOR PREVIEW --- */}
      <section className="landing-calc-section" id="try-calculator">
        <div className="section-head text-center">
          <p className="eyebrow">ทดลองใช้งานจริง</p>
          <h2>ลองคำนวณการหารเงินแบบเรียลไทม์</h2>
          <p className="sub" style={{ maxWidth: "600px", margin: "0 auto" }}>
            ดูตัวอย่างการกระจายเศษสตางค์อย่างเป็นธรรม ไม่ว่ายอดเงินจะหารไม่ลงตัวแค่ไหน ผลรวมจะเท่ากับยอดจริงเสมอ
          </p>
        </div>

        <div className="calc-card">
          <div className="calc-controls">
            <div className="calc-field">
              <label>💵 ยอดเงินรวม (บาท)</label>
              <div className="input-with-currency">
                <span>฿</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(1, Number(e.target.value) || 0))}
                />
              </div>
            </div>

            <div className="calc-field">
              <label>👥 จำนวนสมาชิก ({calcPeople} คน)</label>
              <div className="people-selector">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`people-btn ${calcPeople === num ? "active" : ""}`}
                    onClick={() => setCalcPeople(num)}
                  >
                    {num} คน
                  </button>
                ))}
              </div>
            </div>

            <div className="calc-field">
              <label>⚖️ วิธีการหาร</label>
              <div className="mode-toggle">
                <button
                  type="button"
                  className={calcMode === "equal" ? "active" : ""}
                  onClick={() => setCalcMode("equal")}
                >
                  หารเท่ากันทุกคน
                </button>
                <button
                  type="button"
                  className={calcMode === "weighted" ? "active" : ""}
                  onClick={() => setCalcMode("weighted")}
                >
                  คนแรก 2 ส่วน (เช่น สั่งเยอะ)
                </button>
              </div>
            </div>
          </div>

          <div className="calc-divider" />

          <div className="calc-results">
            <div className="results-header">
              <span>ผลลัพธ์การจัดสรร ({activeNames.length} คน)</span>
              <span className="badge-match">
                ✓ ผลรวม: {formatTHB(satang)} (ตรง 100%)
              </span>
            </div>

            <div className="calc-rows">
              {splitRows.map((row, idx) => (
                <div className="calc-row-item" key={row.memberId}>
                  <div className="calc-member-info">
                    <span className="calc-avatar">{row.memberId.slice(0, 1)}</span>
                    <div>
                      <strong>{row.memberId}</strong>
                      <small>
                        {calcMode === "weighted" && idx === 0
                          ? "สัดส่วน 2 ส่วน (น้ำหนัก 2x)"
                          : "สัดส่วนมาตรฐาน"}
                      </small>
                    </div>
                  </div>
                  <div className="calc-row-amount">
                    {formatTHB(row.amountSatang)}
                  </div>
                </div>
              ))}
            </div>

            <div className="calc-footer-note">
              💡 ในระบบจริง สมาชิกสามารถเลือกบันทึกผู้จ่ายหลายคน (Multiple Payers) ในบิลเดียวได้ และระบบจะคำนวณหักลบส่วนของตนเองให้อัตโนมัติ
            </div>
          </div>
        </div>
      </section>

      {/* --- PROBLEM VS SOLUTION --- */}
      <section className="landing-compare-section">
        <div className="section-head text-center">
          <p className="eyebrow">เปรียบเทียบความต่าง</p>
          <h2>บอกลาความยุ่งยากของการหารเงินแบบเดิม</h2>
        </div>

        <div className="compare-grid">
          <div className="compare-card problem-card">
            <div className="compare-title">
              <span className="compare-icon">❌</span>
              <h3>ปัญหาที่มักเจอเมื่อหารเงินแบบเดิม</h3>
            </div>
            <ul className="compare-list">
              <li>
                <strong>แชท LINE รกและข้อความจม</strong>
                <p>พิมพ์ยอดบอกในกลุ่ม พอคุยเรื่องอื่นเรื่อยๆ ข้อความก็หาย ลืมว่าใครจ่ายอะไรไปแล้วบ้าง</p>
              </li>
              <li>
                <strong>เศษสตางค์ไม่ลงตัว</strong>
                <p>หาร 3 คนออกมาได้ 333.333... บาท ไม่รู้ใครต้องปัดขึ้นปัดลง ยอดรวมไม่ครบ 1,000</p>
              </li>
              <li>
                <strong>โอนเงินสลับกันไปมาหลายรอบ</strong>
                <p>A จ่ายข้าว 400, B จ่ายเครื่องดื่ม 300, C จ่ายขนม 200 ต้องโอนหากันไขว้ไปมาจนงง</p>
              </li>
              <li>
                <strong>สลิปหาย ตามเงินยาก</strong>
                <p>บอกว่าโอนแล้วแต่ไม่มีหลักฐานบันทึกเก็บไว้ ต้องคอยเปิดดูรายการเดินบัญชีเทียบเอง</p>
              </li>
            </ul>
          </div>

          <div className="compare-card solution-card">
            <div className="compare-title">
              <span className="compare-icon">✅</span>
              <h3>สิ่งที่ “หารกัน” ช่วยคุณจัดการ</h3>
            </div>
            <ul className="compare-list">
              <li>
                <strong>บันทึกเป็นหมวดหมู่ มีประวัติย้อนหลัง</strong>
                <p>สรุปเป็นสถิติ กราฟ และยอดคงเหลือแบบ Real-time เข้ามาเช็คได้ทุกเมื่อจากมือถือ</p>
              </li>
              <li>
                <strong>คำนวณระดับสตางค์ (Exact Integer Precision)</strong>
                <p>ระบบกระจายเศษสตางค์ตามลำดับอย่างเป็นธรรม ผลรวมเท่ากับบิลจริงเป๊ะ 100%</p>
              </li>
              <li>
                <strong>ระบบจับคู่หนี้สุทธิ (Optimized Settlements)</strong>
                <p>รวมหนี้ของทุกคนและจับคู่ให้โอนตรงน้อยครั้งที่สุด เช่น 8 รายการเหลือแค่ 2 รายการโอน</p>
              </li>
              <li>
                <strong>แนบสลิป ตรวจสอบ และยืนยันในแอป</strong>
                <p>ผู้โอนแนบรูปสลิป ผู้รับเงินตรวจสอบและกดยืนยัน ยอดหนี้จะถูกตัดลดทันที</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- KEY FEATURES GRID --- */}
      <section className="landing-features" id="features">
        <div className="section-head text-center">
          <p className="eyebrow">ฟังก์ชันที่ออกแบบมาเพื่อคุณ</p>
          <h2>ครบทุกฟีเจอร์สำหรับการแชร์ค่าใช้จ่าย</h2>
          <p className="sub" style={{ maxWidth: "600px", margin: "0 auto" }}>
            สร้างขึ้นโดยยึดหลักความถูกต้องทางการเงินและประสบการณ์การใช้งานที่เป็นธรรมชาติที่สุด
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon">🎯</div>
            <h3>แม่นยำระดับสตางค์ (Satang Precision)</h3>
            <p>
              จัดเก็บและคำนวณเงินทั้งหมดด้วยจำนวนเต็มสตางค์ หมดกังวลเรื่องเศษเงินขาดหายจากการปัดเศษทศนิยม
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon">⚖️</div>
            <h3>3 วิธีการหารที่ยืดหยุ่น (Split Modes)</h3>
            <p>
              รองรับทั้งหารเท่ากัน (Equal), กำหนดจำนวนเงินเอง (Custom), และแบ่งตามสัดส่วนน้ำหนัก (Weighted Shares)
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon">👥</div>
            <h3>สำรองจ่ายหลายคนพร้อมกัน (Multiple Payers)</h3>
            <p>
              ในบิลเดียว สมาชิกหลายคนช่วยกันออกเงินได้ ระบบคำนวณหักลบส่วนของตนเองก่อนอัตโนมัติ
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon">🔄</div>
            <h3>จับคู่หนี้ลดรอบโอน (Debt Optimization)</h3>
            <p>
              คำนวณ Net Balance รวมของกลุ่มให้เท่ากับ 0 เสมอ และหาคู่โอนที่ประหยัดเวลาและค่าธรรมเนียมที่สุด
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon">🧾</div>
            <h3>แนบสลิป & ยืนยันยอดเงิน (Private Proofs)</h3>
            <p>
              อัปโหลดสลิปได้ ผู้รับเงินมีปุ่มกดยืนยันเพื่อตัดหนี้ หรือปฏิเสธพร้อมระบุเหตุผลอย่างโปร่งใส
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon">📊</div>
            <h3>สรุปและส่งออกข้อมูล (Reports & CSV)</h3>
            <p>
              สรุปรายจ่ายตามวันเริ่มต้นสัปดาห์ของกลุ่ม กราฟแบ่งหมวดหมู่ และส่งออกข้อมูลเป็นไฟล์ CSV
            </p>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (3 SIMPLE STEPS) --- */}
      <section className="landing-steps" id="how-it-works">
        <div className="section-head text-center">
          <p className="eyebrow">ขั้นตอนง่าย ๆ</p>
          <h2>เริ่มใช้งานได้ใน 3 สเต็ป</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>สร้างกลุ่มหรือเข้าร่วม</h3>
            <p>
              ตั้งชื่อกลุ่ม กำหนดวันเริ่มต้นสัปดาห์ แล้วแชร์ลิงก์คำเชิญให้เพื่อนสมัครสมาชิกและเข้ากลุ่มได้ทันที
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">2</div>
            <h3>บันทึกบิลรายจ่าย</h3>
            <p>
              ระบุยอดเงิน ใครเป็นคนสำรองจ่าย เลือกวิธีหาร (เท่ากัน/สัดส่วน) ระบบคำนวณส่วนแบ่งให้ทันที
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">3</div>
            <h3>เช็คยอดสุทธิ & เคลียร์เงิน</h3>
            <p>
              ดูว่าต้องโอนให้ใครกี่บาท สแกนจ่ายตามบัญชี/พร้อมเพย์ที่เพื่อนใส่ไว้ แนบสลิปแล้วรอเพื่อนกดยืนยัน จบ!
            </p>
          </div>
        </div>
      </section>

      {/* --- WHO IS IT FOR? --- */}
      <section className="landing-usecases">
        <div className="section-head text-center">
          <p className="eyebrow">ครอบคลุมทุกการใช้งาน</p>
          <h2>ออกแบบมาเพื่อใครบ้าง?</h2>
        </div>

        <div className="usecase-grid">
          <div className="usecase-item">
            <span className="usecase-icon">🏠</span>
            <h4>รูมเมท & บ้านเช่า / คอนโด</h4>
            <p>แชร์ค่าเช่าบ้าน ค่าน้ำ ค่าไฟ อินเทอร์เน็ต น้ำดื่ม และของใช้ส่วนกลางในบ้าน/คอนโด</p>
          </div>

          <div className="usecase-item">
            <span className="usecase-icon">🚗</span>
            <h4>ทริปท่องเที่ยว & แบกเป้</h4>
            <p>ทริปต่างจังหวัด ทริปต่างประเทศ ค่าที่พัก ค่าน้ำมัน ค่าผ่านทาง และมื้ออาหารใหญ่</p>
          </div>

          <div className="usecase-item">
            <span className="usecase-icon">🍲</span>
            <h4>กลุ่มเพื่อนสังสรรค์ & ปาร์ตี้</h4>
            <p>มื้ออาหารบุฟเฟต์ ปาร์ตี้วันเกิด มีคนออกเงินให้ก่อน แล้วมาเคลียร์เงินกันทีหลัง</p>
          </div>

          <div className="usecase-item">
            <span className="usecase-icon">💼</span>
            <h4>ทีมงาน & กองกลางชมรม</h4>
            <p>ซื้ออุปกรณ์จัดงาน สแปร์เงินล่วงหน้า เคลียร์ค่าใช้จ่ายของโปรเจกต์ได้อย่างโปร่งใส</p>
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="landing-bottom-cta">
        <div className="bottom-cta-box">
          <h2>พร้อมเริ่มจัดการเงินกับเพื่อนให้ลงตัวแล้วหรือยัง?</h2>
          <p>
            ไม่ต้องปวดหัวเรื่องเศษสตางค์ ไม่ต้องทวงเงินในแชทให้เสียบรรยากาศ เริ่มต้นใช้งานได้ฟรีทันที
          </p>
          <div className="bottom-cta-actions" style={{ justifyContent: "center" }}>
            <button className="hero-demo-prominent-btn" onClick={handleDemoStart}>
              <span className="demo-btn-icon">⚡</span>
              <span className="demo-btn-text">ทดลองเล่นระบบเดโม (ไม่ต้องสมัคร)</span>
              <span className="demo-btn-arrow">➔</span>
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="brand" style={{ fontSize: "20px" }}>
            หาร<i>กัน</i>
          </div>
          <p style={{ color: "#8a948c", fontSize: "13px", margin: "6px 0 0" }}>
            Group Expense Manager · ระบบจัดการค่าใช้จ่ายกลุ่มภาษาไทย แม่นยำระดับสตางค์
          </p>
        </div>
        <div className="footer-links">
          <Link href="/login">เข้าสู่ระบบ</Link>
          <Link href="/register">สมัครสมาชิก</Link>
          <a href="#try-calculator">ทดลองคำนวณสด</a>
          <a href="#features">จุดเด่น</a>
          <a href="#how-it-works">วิธีใช้งาน</a>
        </div>
        <div className="footer-bottom">
          <small>© 2026 หารกัน (Group Expense Manager) · สงวนลิขสิทธิ์</small>
        </div>
      </footer>
    </div>
  );
}
