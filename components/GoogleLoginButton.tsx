"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGroup, Member } from "@/lib/group-context";

interface GoogleLoginButtonProps {
  onSuccess?: (member: Member) => void;
  text?: string;
  style?: React.CSSProperties;
}

export function GoogleLoginButton({
  onSuccess,
  text = "เข้าสู่ระบบด้วย Google",
  style,
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const { loginWithGoogle, members } = useGroup();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // สำหรับฟอร์มกรอกบัญชี Google อื่น
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customError, setCustomError] = useState("");

  const defaultGoogleAccounts = [
    {
      name: "ชัชวาลย์ (กอล์ฟ)",
      email: "golf2545mc@gmail.com",
      avatarColor: "#1f6f53",
    },
    {
      name: "มินนี่ (Min)",
      email: "min.dev@gmail.com",
      avatarColor: "#e67e22",
    },
    {
      name: "ต้น สมบูรณ์",
      email: "ton.split@gmail.com",
      avatarColor: "#2980b9",
    },
  ];

  const handleSelectAccount = (account: { name: string; email: string }) => {
    setSelectedEmail(account.email);
    setLoading(true);

    setTimeout(() => {
      try {
        const loggedInMember = loginWithGoogle({
          name: account.name,
          email: account.email,
        });

        setIsOpen(false);
        setLoading(false);

        if (onSuccess) {
          onSuccess(loggedInMember);
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Google login error:", err);
        setLoading(false);
      }
    }, 600);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError("");

    if (!customName.trim()) {
      setCustomError("กรุณาระบุชื่อบัญชี Google");
      return;
    }

    if (!customEmail.trim() || !customEmail.includes("@")) {
      setCustomError("กรุณาระบุอีเมลที่ถูกต้อง (เช่น yourname@gmail.com)");
      return;
    }

    handleSelectAccount({
      name: customName.trim(),
      email: customEmail.trim().toLowerCase(),
    });
  };

  return (
    <>
      {/* ปุ่มกด Sign In with Google */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "11px 16px",
          borderRadius: "10px",
          border: "1px solid var(--border, #d0d7d1)",
          background: "var(--surface-card, #ffffff)",
          color: "var(--foreground, #18231e)",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          ...style,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#4285F4";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(66, 133, 244, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border, #d0d7d1)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
        }}
      >
        {/* Official 4-color Google G Icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>{text}</span>
      </button>

      {/* โมดอลเลือกบัญชี Google (Google Account Chooser Modal) */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setIsOpen(false);
          }}
        >
          <div
            style={{
              background: "var(--surface-card, #ffffff)",
              color: "var(--foreground, #18231e)",
              width: "100%",
              maxWidth: "420px",
              borderRadius: "18px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1px solid var(--border, #e5e9e6)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* ส่วนหัวหน้าต่าง Google */}
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--border, #f0f3f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>ลงชื่อเข้าใช้ด้วย Google</h3>
                  <span style={{ fontSize: "12px", color: "var(--muted, #6a766e)" }}>
                    เลือกบัญชีเพื่อดำเนินการต่อไปยัง <strong>หารกัน</strong>
                  </span>
                </div>
              </div>

              {!loading && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "var(--muted, #888)",
                    padding: "4px",
                    lineHeight: 1,
                  }}
                  title="ปิด"
                >
                  ✕
                </button>
              )}
            </div>

            {/* รายการบัญชี */}
            <div style={{ padding: "16px 20px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "36px 12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      border: "3px solid #e2e8f0",
                      borderTopColor: "#4285F4",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto 16px",
                    }}
                  />
                  <strong style={{ fontSize: "15px", display: "block" }}>
                    กำลังยืนยันตัวตนกับบัญชี Google...
                  </strong>
                  <span style={{ fontSize: "13px", color: "var(--muted, #6a766e)", marginTop: "4px", display: "block" }}>
                    {selectedEmail}
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {defaultGoogleAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleSelectAccount(acc)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          border: "1px solid var(--border, #eef0ed)",
                          background: "var(--surface-input, #fcfdfc)",
                          color: "inherit",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(66, 133, 244, 0.08)";
                          e.currentTarget.style.borderColor = "rgba(66, 133, 244, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--surface-input, #fcfdfc)";
                          e.currentTarget.style.borderColor = "var(--border, #eef0ed)";
                        }}
                      >
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: acc.avatarColor,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "15px",
                            flexShrink: 0,
                          }}
                        >
                          {acc.name.slice(0, 1)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>{acc.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted, #666)", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {acc.email}
                          </div>
                        </div>
                        <span style={{ fontSize: "12px", color: "#4285F4", fontWeight: 600 }}>เลือก ➔</span>
                      </button>
                    ))}
                  </div>

                  {/* ป้อนบัญชี Google อื่น */}
                  <div style={{ marginTop: "12px", borderTop: "1px dashed var(--border, #eef0ed)", paddingTop: "12px" }}>
                    {!showCustomInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(true)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "none",
                          background: "none",
                          color: "#4285F4",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <span>＋</span> ใช้บัญชี Google อื่น (Use another account)
                      </button>
                    ) : (
                      <form onSubmit={handleCustomSubmit} style={{ marginTop: "8px" }}>
                        <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 600 }}>
                          ระบุข้อมูลบัญชี Google ของคุณ:
                        </h4>

                        {customError && (
                          <div style={{ fontSize: "12px", color: "#c0392b", marginBottom: "8px" }}>
                            ⚠️ {customError}
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <input
                            type="text"
                            placeholder="ชื่อของคุณ (เช่น ชัชวาลย์)"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            required
                            style={{
                              padding: "8px 12px",
                              fontSize: "13px",
                              borderRadius: "8px",
                              border: "1px solid var(--border, #d0d7d1)",
                            }}
                          />
                          <input
                            type="email"
                            placeholder="อีเมล Google (เช่น yourname@gmail.com)"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            required
                            style={{
                              padding: "8px 12px",
                              fontSize: "13px",
                              borderRadius: "8px",
                              border: "1px solid var(--border, #d0d7d1)",
                            }}
                          />
                          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            <button
                              type="button"
                              onClick={() => setShowCustomInput(false)}
                              className="secondary"
                              style={{ flex: 1, padding: "8px", fontSize: "12px" }}
                            >
                              ยกเลิก
                            </button>
                            <button
                              type="submit"
                              className="primary"
                              style={{ flex: 2, padding: "8px", fontSize: "12px", background: "#4285F4" }}
                            >
                              ดำเนินการต่อ
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ส่วนท้ายโมดอล */}
            <div
              style={{
                padding: "12px 20px",
                background: "var(--surface-muted, #f8faf9)",
                borderTop: "1px solid var(--border, #f0f3f1)",
                textAlign: "center",
                fontSize: "11px",
                color: "var(--muted, #777)",
              }}
            >
              การดำเนินการต่อหมายความว่าคุณยินยอมให้ หารกัน เข้าถึงชื่อและอีเมลของคุณตามนโยบายความเป็นส่วนตัว
            </div>
          </div>
        </div>
      )}
    </>
  );
}
