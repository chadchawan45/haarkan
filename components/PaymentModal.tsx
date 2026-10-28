"use client";

import React, { useState, useEffect } from "react";
import { useGroup, Member } from "@/lib/group-context";
import { formatTHB, parseTHB } from "@/lib/money";
import { generatePromptPayDataUrl } from "@/lib/promptpay";

// Helper ย่อขนาดรูปสลิปก่อนบันทึกลง localStorage เพื่อป้องกัน QuotaExceededError
async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75
): Promise<{ dataUrl: string; sizeKb: number }> {
  if (!file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          dataUrl: reader.result as string,
          sizeKb: Math.round(file.size / 1024),
        });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const rawUrl = e.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            sizeKb: Math.round((rawUrl.length * 0.75) / 1024),
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        const sizeKb = Math.round((compressedDataUrl.length * 0.75) / 1024);
        resolve({ dataUrl: compressedDataUrl, sizeKb });
      };
      img.onerror = () => {
        const rawUrl = e.target?.result as string;
        resolve({
          dataUrl: rawUrl,
          sizeKb: Math.round((rawUrl.length * 0.75) / 1024),
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve({ dataUrl: "", sizeKb: 0 });
    };
    reader.readAsDataURL(file);
  });
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientId?: string;
  defaultAmountSatang?: number;
  settlementMode?: "direct" | "optimized" | "manual";
}

export function PaymentModal({
  isOpen,
  onClose,
  defaultRecipientId,
  defaultAmountSatang = 0,
  settlementMode = "manual",
}: PaymentModalProps) {
  const {
    members,
    currentMemberId,
    currentMember,
    payments,
    createPayment,
    uploadProofAndSubmit,
    optimizedSettlementList,
    directSettlementList,
    updateProfile,
    isDemo,
    triggerDemoLock,
  } = useGroup();

  const otherMembers = members.filter((m) => m.id !== currentMemberId && m.status === "active");
  const [toMemberId, setToMemberId] = useState(defaultRecipientId ?? (otherMembers[0]?.id || ""));
  const [bahtInput, setBahtInput] = useState(
    defaultAmountSatang > 0 ? (defaultAmountSatang / 100).toFixed(2) : ""
  );
  const [slipUrl, setSlipUrl] = useState<string>("");
  const [slipName, setSlipName] = useState<string>("");
  const [slipSizeKb, setSlipSizeKb] = useState<number>(0);
  const [isCompressingSlip, setIsCompressingSlip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState("");

  // PromptPay Dynamic QR Code States
  const [customPromptpay, setCustomPromptpay] = useState("");
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [showStaticQrFallback, setShowStaticQrFallback] = useState(false);

  // อัปเดตและใส่จำนวนเงิน + ผู้รับเงินอัตโนมัติตามที่กดแจ้งโอนเงิน
  useEffect(() => {
    if (isOpen) {
      const targetRecipient = defaultRecipientId || (otherMembers[0]?.id ?? "");
      setToMemberId(targetRecipient);
      setCustomPromptpay("");
      setShowStaticQrFallback(false);

      if (defaultAmountSatang && defaultAmountSatang > 0) {
        setBahtInput((defaultAmountSatang / 100).toFixed(2));
      } else {
        // หากเปิดแบบ manual ลองดูว่ามีข้อเสนอค้างจ่ายให้คนนี้หรือไม่
        const relevantSettlements =
          settlementMode === "direct" ? directSettlementList : optimizedSettlementList;
        const suggested = relevantSettlements.find(
          (s) => s.fromMemberId === currentMemberId && s.toMemberId === targetRecipient
        );
        if (suggested && suggested.amountSatang > 0) {
          setBahtInput((suggested.amountSatang / 100).toFixed(2));
        } else {
          setBahtInput("");
        }
      }

      setSlipUrl("");
      setSlipName("");
      setSlipSizeKb(0);
      setIsCompressingSlip(false);
      setCopiedText("");
    }
  }, [isOpen, defaultRecipientId, defaultAmountSatang, currentMemberId, settlementMode]);

  const satang = parseTHB(bahtInput) ?? 0;
  const recipient = members.find((m) => m.id === toMemberId);
  const activePromptpay = recipient?.promptpayNumber || customPromptpay.trim();

  // ตรวจสอบว่ามีรายการแจ้งโอนที่กำลังรอตรวจสอบอยู่ให้ผู้รับคนนี้หรือไม่
  const pendingPaymentToRecipient = payments.find(
    (p) =>
      p.fromMemberId === currentMemberId &&
      p.toMemberId === toMemberId &&
      p.status === "submitted"
  );

  // สร้าง QR Code พร้อมเพย์ตามจำนวนเงินแบบ Real-time
  useEffect(() => {
    let isCancelled = false;
    const amountBaht = satang > 0 ? satang / 100 : undefined;

    if (activePromptpay && activePromptpay.replace(/[^0-9]/g, "").length >= 9) {
      setIsGeneratingQr(true);
      generatePromptPayDataUrl(activePromptpay, amountBaht, { width: 300, margin: 2 })
        .then((url) => {
          if (!isCancelled) {
            setDynamicQrUrl(url);
            setIsGeneratingQr(false);
          }
        })
        .catch((err) => {
          console.error("Error generating PromptPay QR:", err);
          if (!isCancelled) {
            setDynamicQrUrl("");
            setIsGeneratingQr(false);
          }
        });
    } else {
      setDynamicQrUrl("");
      setIsGeneratingQr(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [activePromptpay, satang]);

  if (!isOpen) return null;

  // ตรวจสอบข้อเสนอหนี้ค้างชำระของคนนี้
  const relevantSettlements =
    settlementMode === "direct" ? directSettlementList : optimizedSettlementList;
  const suggested = relevantSettlements.find(
    (s) => s.fromMemberId === currentMemberId && s.toMemberId === toMemberId
  );

  const handleRecipientChange = (newToId: string) => {
    setToMemberId(newToId);
    setCustomPromptpay("");
    setShowStaticQrFallback(false);
    const sug = relevantSettlements.find(
      (s) => s.fromMemberId === currentMemberId && s.toMemberId === newToId
    );
    if (sug && sug.amountSatang > 0) {
      setBahtInput((sug.amountSatang / 100).toFixed(2));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipName(file.name);
      setIsCompressingSlip(true);
      try {
        const result = await compressImageFile(file);
        setSlipUrl(result.dataUrl);
        setSlipSizeKb(result.sizeKb);
      } catch (err) {
        console.error("Failed to compress slip:", err);
      } finally {
        setIsCompressingSlip(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      triggerDemoLock("การบันทึกการชำระเงินและส่งสลิป");
      onClose();
      return;
    }
    if (!toMemberId || satang <= 0 || isCompressingSlip) return;

    setIsSubmitting(true);
    const paymentId = createPayment(currentMemberId, toMemberId, satang, settlementMode);

    if (slipUrl) {
      uploadProofAndSubmit(paymentId, slipName || "receipt.jpg", slipUrl);
    }

    setIsSubmitting(false);
    onClose();
  };

  const recipientDisplayName = recipient?.nickname
    ? `${recipient.nickname} (${recipient.name})`
    : recipient?.name || "ผู้รับเงิน";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "90dvh",
          overflowY: "auto",
          maxWidth: "460px",
          width: "95%",
          background: "var(--card-bg)",
          color: "var(--text-main)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="modal-header">
          <h3>แจ้งชำระเงิน</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {isDemo && (
          <div
            style={{
              background: "var(--warning-light, #fef3c7)",
              border: "1px solid var(--warning, #fde68a)",
              color: "var(--warning, #92400e)",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "14px",
            }}
          >
            🔒 <strong>โหมดทดลองใช้งาน (Demo Mode):</strong> ฟังก์ชันแจ้งชำระเงินถูกล็อกไว้ (เปิดให้ทดลองเฉพาะ &quot;＋ เพิ่มรายจ่าย&quot; เท่านั้น)
          </div>
        )}

        {pendingPaymentToRecipient && (
          <div
            style={{
              background: "rgba(245, 158, 11, 0.12)",
              border: "1.5px solid #f59e0b",
              color: "#92400e",
              borderRadius: "12px",
              padding: "12px 14px",
              fontSize: "13px",
              marginBottom: "16px",
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
              <span>⚠️</span>
              <span>คุณมียอดแจ้งโอนให้ {recipientDisplayName} ที่รอตรวจสอบอยู่</span>
            </div>
            <div style={{ marginTop: "4px" }}>
              ยอด <strong>{formatTHB(pendingPaymentToRecipient.amountSatang)}</strong> (ส่งเมื่อ{" "}
              {new Date(pendingPaymentToRecipient.createdAt).toLocaleDateString("th-TH")})
            </div>
            <div style={{ fontSize: "11px", color: "#b45309", marginTop: "4px" }}>
              💡 หากเพิ่งโอนไป กรุณารอเพื่อนกด &ldquo;ยืนยันสลิป&rdquo; ก่อนส่งซ้ำ เพื่อป้องกันการหักหนี้ซ้ำซ้อน
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            className="notice"
            style={{
              marginTop: 0,
              marginBottom: "14px",
              background: "var(--surface-input, rgba(125, 125, 125, 0.05))",
              border: "1px solid var(--border)",
            }}
          >
            👤 ผู้ชำระ: <strong>{currentMember.nickname ? `${currentMember.nickname} (${currentMember.name})` : currentMember.name}</strong>
          </div>

          <label className="field">
            โอนให้ใคร
            <select
              value={toMemberId}
              onChange={(e) => handleRecipientChange(e.target.value)}
              required
              style={{
                background: "var(--bg)",
                color: "var(--text-main)",
                border: "1px solid var(--border-strong)",
              }}
            >
              {otherMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nickname ? `${m.nickname} (${m.name})` : m.name}
                </option>
              ))}
            </select>
          </label>

          {/* ข้อมูลบัญชีธนาคารและพร้อมเพย์ของผู้รับ */}
          {recipient && (
            <div
              style={{
                background: "var(--surface-input, rgba(125, 125, 125, 0.05))",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "12px 14px",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <strong style={{ fontSize: "12px", color: "var(--primary)" }}>
                  💳 บัญชีรับเงินของ {recipientDisplayName}
                </strong>
                {copiedText && (
                  <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700 }}>
                    {copiedText}
                  </span>
                )}
              </div>

              {recipient.bankAccountNumber ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-main)" }}>
                    <strong>{recipient.bankName || "ธนาคาร"}:</strong>{" "}
                    <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{recipient.bankAccountNumber}</span>
                  </div>
                  <button
                    type="button"
                    className="outline"
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                    onClick={() => {
                      navigator.clipboard.writeText(recipient.bankAccountNumber?.replace(/[^0-9]/g, "") || "");
                      setCopiedText("✓ คัดลอกเลขบัญชีแล้ว");
                      setTimeout(() => setCopiedText(""), 2500);
                    }}
                  >
                    คัดลอกเลขบัญชี
                  </button>
                </div>
              ) : null}

              {recipient.promptpayNumber ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-main)" }}>
                    <strong>พร้อมเพย์:</strong>{" "}
                    <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{recipient.promptpayNumber}</span>
                  </div>
                  <button
                    type="button"
                    className="outline"
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                    onClick={() => {
                      navigator.clipboard.writeText(recipient.promptpayNumber?.replace(/[^0-9]/g, "") || "");
                      setCopiedText("✓ คัดลอกพร้อมเพย์แล้ว");
                      setTimeout(() => setCopiedText(""), 2500);
                    }}
                  >
                    คัดลอกพร้อมเพย์
                  </button>
                </div>
              ) : null}

              {/* หากผู้รับยังไม่มีเบอร์พร้อมเพย์ เปิดช่องให้ระบุเบอร์เพื่อสร้าง QR Code ตามยอดเงินได้ทันที */}
              {!recipient.promptpayNumber && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "var(--primary-light, rgba(31, 111, 83, 0.08))",
                    border: "1px dashed var(--primary)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", marginBottom: "4px" }}>
                    ⚡ ต้องการสร้าง QR Code ตามยอดเงิน?
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", lineHeight: 1.4 }}>
                    ผู้รับยังไม่ได้บันทึกเบอร์พร้อมเพย์ในโปรไฟล์ กรุณาระบุเบอร์โทรพร้อมเพย์ของผู้รับ (เช่น 0812345678) เพื่อให้ระบบสร้าง QR Code พร้อมยอดเงินให้อัตโนมัติ:
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="เช่น 0812345678 หรือ เลขบัตร 13 หลัก"
                      value={customPromptpay}
                      onChange={(e) => setCustomPromptpay(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-strong)",
                        background: "var(--bg)",
                        color: "var(--text-main)",
                      }}
                    />
                    {customPromptpay.replace(/[^0-9]/g, "").length >= 9 && (
                      <button
                        type="button"
                        className="secondary"
                        style={{ fontSize: "11px", padding: "6px 10px", whiteSpace: "nowrap" }}
                        onClick={() => {
                          updateProfile(recipient.id, { promptpayNumber: customPromptpay.trim() });
                          setCopiedText("✓ บันทึกเบอร์ให้ผู้รับแล้ว");
                          setTimeout(() => setCopiedText(""), 2500);
                        }}
                        title="บันทึกเบอร์นี้ลงโปรไฟล์ของผู้รับ จะได้ไม่ต้องกรอกซ้ำ"
                      >
                        💾 บันทึกจำไว้
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* รูป QR Code เดิมที่ผู้รับเคยอัปโหลดไว้ (ถ้ามี) */}
              {recipient.qrCodeUrl && !dynamicQrUrl && (
                <div style={{ textAlign: "center", marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed var(--border)" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    📷 สแกนรูป QR Code ที่ผู้รับเคยแนบไว้:
                  </span>
                  <img
                    src={recipient.qrCodeUrl}
                    alt="Recipient Uploaded QR"
                    style={{
                      maxWidth: "140px",
                      maxHeight: "140px",
                      borderRadius: "8px",
                      margin: "6px auto 0",
                      display: "block",
                      border: "1px solid var(--border)",
                      background: "#fff",
                      padding: "4px",
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* จำนวนเงิน */}
          <label className="field">
            จำนวนเงิน (บาท)
            <input
              type="text"
              inputMode="decimal"
              value={bahtInput}
              onChange={(e) => setBahtInput(e.target.value)}
              placeholder="0.00"
              required
              style={{
                fontSize: "16px",
                fontWeight: 700,
                background: "var(--bg)",
                color: "var(--text-main)",
                border: "1px solid var(--border-strong)",
              }}
            />
          </label>

          {suggested && suggested.amountSatang > 0 && satang !== suggested.amountSatang && (
            <div style={{ marginTop: "-8px", marginBottom: "8px" }}>
              <button
                type="button"
                className="link"
                style={{ fontSize: "12px", color: "var(--primary)" }}
                onClick={() => setBahtInput((suggested.amountSatang / 100).toFixed(2))}
              >
                ⚡ ใส่ยอดตามข้อเสนออัตโนมัติ ({formatTHB(suggested.amountSatang)})
              </button>
            </div>
          )}

          {satang > 0 && (
            <p className="sub" style={{ color: "var(--primary)", fontWeight: 700, marginTop: "4px", fontSize: "14px" }}>
              ยอดชำระ: {formatTHB(satang)}
            </p>
          )}

          {/* ======================================================== */}
          {/* กล่องแสดง Dynamic PromptPay QR Code ตามจำนวนเงิน (EMVCo) */}
          {/* ======================================================== */}
          {dynamicQrUrl && (
            <div
              style={{
                marginTop: "16px",
                marginBottom: "16px",
                padding: "16px",
                borderRadius: "16px",
                background: "#ffffff",
                border: "2px solid #003d6b",
                textAlign: "center",
                boxShadow: "0 8px 24px rgba(0, 61, 107, 0.12)",
                color: "#18231e",
              }}
            >
              {/* แถบหัว THAI QR PAYMENT */}
              <div
                style={{
                  background: "#003d6b",
                  color: "#ffffff",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.5px" }}>
                  THAI QR PAYMENT
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    background: "rgba(255,255,255,0.25)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  พร้อมเพย์
                </span>
              </div>

              {/* รูป QR Code ที่สร้างขึ้นมาตามยอดเงิน */}
              <div
                style={{
                  display: "inline-block",
                  padding: "8px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <img
                  src={dynamicQrUrl}
                  alt="Dynamic PromptPay QR Code"
                  style={{
                    width: "210px",
                    height: "210px",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </div>

              {/* รายละเอียดผู้รับ & ยอดเงินล็อกใน QR */}
              <div style={{ marginTop: "10px" }}>
                <div style={{ fontSize: "13px", color: "#475569" }}>
                  ผู้รับ: <strong style={{ color: "#0f172a" }}>{recipientDisplayName}</strong>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", marginTop: "2px" }}>
                  พร้อมเพย์: {activePromptpay}
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px 14px",
                    background: "#f0fdf4",
                    borderRadius: "10px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>
                    ยอดเงินระบุใน QR Code อัตโนมัติ:
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#15803d", margin: "2px 0" }}>
                    {formatTHB(satang > 0 ? satang : 0)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#166534" }}>
                    ✓ สแกนด้วยแอปธนาคารใดก็ได้ ยอดเงินจะขึ้นอัตโนมัติ ไม่ต้องพิมพ์เอง
                  </div>
                </div>
              </div>

              {/* ปุ่มดาวน์โหลด QR และคัดลอกยอด */}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "center" }}>
                <a
                  href={dynamicQrUrl}
                  download={`promptpay-qr-${satang > 0 ? (satang / 100).toFixed(2) : "zero"}baht.png`}
                  className="outline"
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    borderRadius: "8px",
                    color: "#003d6b",
                    borderColor: "#003d6b",
                  }}
                >
                  💾 บันทึกรูป QR
                </a>
                <button
                  type="button"
                  className="outline"
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    borderRadius: "8px",
                    color: "#003d6b",
                    borderColor: "#003d6b",
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText((satang / 100).toFixed(2));
                    setCopiedText("✓ คัดลอกยอดเงินแล้ว");
                    setTimeout(() => setCopiedText(""), 2500);
                  }}
                >
                  📋 คัดลอกยอด
                </button>
              </div>
            </div>
          )}

          {/* แนบสลิปการโอนเงิน */}
          <div className="field" style={{ marginTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>แนบสลิปการโอนเงิน (JPG, PNG)</span>
              {isCompressingSlip && (
                <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 600 }}>
                  ⏳ กำลังย่อขนาดรูปภาพ...
                </span>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileUpload}
              disabled={isCompressingSlip}
              style={{ marginTop: "6px" }}
            />
          </div>

          {slipUrl && (
            <div
              style={{
                marginTop: "10px",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "10px",
                textAlign: "center",
                background: "var(--surface-input, rgba(125, 125, 125, 0.05))",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }}>
                  {slipName}
                </span>
                {slipSizeKb > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      background: "rgba(31, 111, 83, 0.12)",
                      color: "var(--primary)",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      fontWeight: 600,
                    }}
                  >
                    ⚡ ย่อขนาดรูปภาพเหลือ ~{slipSizeKb} KB
                  </span>
                )}
              </div>
              <img
                src={slipUrl}
                alt="สลิป"
                style={{ maxHeight: "150px", borderRadius: "8px", objectFit: "contain", margin: "0 auto", display: "block" }}
              />
            </div>
          )}

          <button
            type="submit"
            className={isDemo ? "secondary full-btn" : "primary full-btn"}
            disabled={!isDemo && (satang <= 0 || !toMemberId || isSubmitting || isCompressingSlip)}
            style={{
              marginTop: "14px",
              ...(isDemo ? { borderColor: "var(--warning)", color: "var(--warning)", background: "var(--warning-light)" } : {}),
            }}
          >
            {isDemo
              ? "🔒 ล็อกในโหมดทดลอง (เปิดเฉพาะเพิ่มรายจ่าย)"
              : isCompressingSlip
              ? "กำลังประมวลผลรูป..."
              : slipUrl
              ? "✓ บันทึกและส่งสลิปให้ตรวจสอบ"
              : "บันทึกรายการ (ยังไม่แนบสลิป)"}
          </button>
        </form>
      </div>
    </div>
  );
}
